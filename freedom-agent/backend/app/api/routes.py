"""FastAPI Route Handlers for Freedom Agent."""
from typing import Dict, Any, List, Optional
import os
import json
from dataclasses import asdict

from backend.app.core.config import get_settings, PrivacyMode, PolicyProfile
from backend.app.schemas.task import TaskItem, TaskState, TaskEvent
from backend.app.schemas.policies import ModelPolicy
from backend.app.execution.state_machine import TaskStateMachine
from backend.app.execution.sandbox import ExecutionSandbox
from backend.app.execution.approvals import ApprovalManager
from backend.app.tools.registry import ToolRegistry
from backend.app.agents.orchestrator import OrchestratorAgent
from backend.app.models.registry import ModelRegistry
from backend.app.memory.context_manager import ContextManager
from backend.app.core.security import generate_secure_id

class FreedomAgentService:
    """Singleton service maintaining application state and orchestration runtime."""

    def __init__(self):
        self.settings = get_settings()
        self.privacy_mode = self.settings.privacy_mode
        self.policy = ModelPolicy.get_preset(self.settings.policy_profile, self.privacy_mode)
        
        self.sandbox = ExecutionSandbox(
            workspace_root=self.settings.workspace_root,
            allow_sensitive=self.policy.allow_sensitive_file_inspection,
        )
        self.approvals = ApprovalManager()
        self.tools = ToolRegistry(self.sandbox, self.approvals, self.policy)
        self.models = ModelRegistry(
            privacy_mode=self.privacy_mode,
            ollama_url=self.settings.ollama_base_url,
            openai_base=self.settings.openai_api_base,
            openai_key=self.settings.openai_api_key,
        )
        self.memory = ContextManager(db_path="./freedom_agent.db")
        self.orchestrator = OrchestratorAgent(self.tools, max_retries=self.policy.max_retries)

        self.tasks: Dict[str, TaskItem] = {}
        self.state_machines: Dict[str, TaskStateMachine] = {}

    def update_privacy(self, mode_str: str) -> Dict[str, Any]:
        mode = PrivacyMode(mode_str)
        self.privacy_mode = mode
        self.policy.privacy_mode = mode
        self.models.privacy_mode = mode
        self.tools.browser._privacy_mode = mode
        return {"status": "success", "privacy_mode": mode.value}

    def update_policy(self, profile_str: str) -> Dict[str, Any]:
        profile = PolicyProfile(profile_str)
        self.policy = ModelPolicy.get_preset(profile, self.privacy_mode)
        self.tools._policy = self.policy
        return {"status": "success", "policy": self.policy.to_dict()}

    def update_agent_config(self, agent_id: str, permitted_tools: Optional[List[str]] = None, custom_instructions: Optional[str] = None) -> Dict[str, Any]:
        if permitted_tools is not None:
            self.policy.agent_tool_allowlist[agent_id] = permitted_tools
        return {
            "status": "success",
            "agent_id": agent_id,
            "permitted_tools": self.policy.agent_tool_allowlist.get(agent_id, []),
            "custom_instructions": custom_instructions or "",
        }

    def get_agent_list(self) -> List[Dict[str, Any]]:
        agents_meta = [
            ("orchestrator", "Orchestrator Agent", "Workflow Planner & Supervisor", "Decomposes user requests into execution graphs, sequences specialists, and verifies completion using real tool results."),
            ("architect", "Software Architect", "System & Boundary Designer", "Analyzes repository topology, maps dependencies, and devises minimal-change task specifications."),
            ("developer", "Developer Agent", "Code & Patch Synthesizer", "Reads source files, synthesizes targeted unified diffs, and preserves codebase conventions."),
            ("debugger", "Debugger Agent", "Trace & Regression Investigator", "Analyzes test stack traces and compiler logs to isolate regressions and apply targeted repairs."),
            ("tester", "Test Engineer", "Automated Suite Runner", "Discovers test frameworks (pytest, unittest, npm) and measures passed/failed/skipped assertions."),
            ("reviewer", "Code Reviewer", "Quality & Scope Auditor", "Evaluates unified diffs for fragile assumptions, anti-patterns, and unintended modifications outside scope."),
            ("security_reviewer", "Security Reviewer", "Zero-Trust & Sandbox Guard", "Audits diffs for leaked credentials, path traversal attempts, and unsafe command injection."),
            ("researcher", "Research Agent", "Offline Reference & Docs Lookup", "Extracts verified reference patterns strictly from local documentation while honoring fail-closed privacy bounds."),
        ]
        active_agents = {t.active_agent for t in self.tasks.values() if t.state in (TaskState.PLANNING, TaskState.RUNNING, TaskState.VERIFYING)}
        res = []
        for aid, name, role, desc in agents_meta:
            res.append({
                "agent_id": aid,
                "name": name,
                "role_title": role,
                "description": desc,
                "permitted_tools": self.policy.agent_tool_allowlist.get(aid, []),
                "assigned_model": self.policy.preferred_model,
                "is_active": aid in active_agents,
                "status": "active" if aid in active_agents else "idle",
            })
        return res

    def create_task(self, prompt: str, workspace_path: Optional[str] = None) -> TaskItem:
        task_id = generate_secure_id("task")
        ws = os.path.abspath(workspace_path) if workspace_path else self.settings.workspace_root
        
        # Instantiate task-scoped sandbox and tools
        task_sandbox = ExecutionSandbox(
            workspace_root=ws,
            allow_sensitive=self.policy.allow_sensitive_file_inspection,
        )
        task_tools = ToolRegistry(task_sandbox, self.approvals, self.policy)
        task_orchestrator = OrchestratorAgent(task_tools, max_retries=self.policy.max_retries)

        # Configure task
        task = TaskItem(
            task_id=task_id,
            title=prompt[:60] + ("..." if len(prompt) > 60 else ""),
            prompt=prompt,
            workspace_path=ws,
            state=TaskState.PENDING,
            assigned_model=self.policy.preferred_model,
        )
        sm = TaskStateMachine()
        self.tasks[task_id] = task
        self.state_machines[task_id] = sm

        # Save initial event
        task.events.append(TaskEvent(
            event_id=generate_secure_id("evt"),
            task_id=task_id,
            event_type="CREATED",
            message=f"Task created with model {task.assigned_model}",
        ))

        # Run multi-agent orchestrator workflow
        task_orchestrator.execute_workflow(task, sm)

        # Persist report to memory
        self.memory.save_task_report(
            task_id=task_id,
            workspace_id=ws,
            title=task.title,
            prompt=task.prompt,
            plan_steps=task.plan_steps,
            diff=task.diff,
            test_summary="Verified" if task.state == TaskState.COMPLETED else "Failed / Paused",
            final_state=task.state.value,
        )
        return task

# Global service instance
service = FreedomAgentService()

def build_fastapi_app():
    """Builds the FastAPI application with all endpoints."""
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel

    app = FastAPI(
        title="Freedom Agent API",
        version="0.1.0",
        description="Privacy-First Multi-Agent AI Coding and Automation Runtime",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class TaskCreateRequest(BaseModel):
        prompt: str
        workspace_path: Optional[str] = None

    class PrivacyUpdateRequest(BaseModel):
        privacy_mode: str

    class PolicyUpdateRequest(BaseModel):
        policy_profile: str

    @app.get("/api/health")
    def health():
        return {
            "status": "healthy",
            "version": "0.1.0",
            "privacy_mode": service.privacy_mode.value,
            "policy_profile": service.policy.profile_name.value,
        }

    @app.get("/api/providers")
    def get_providers():
        return service.models.get_provider_status()

    @app.get("/api/models")
    def get_models():
        return [m.to_dict() for m in service.models.list_available_models()]

    class AgentUpdateRequest(BaseModel):
        permitted_tools: Optional[List[str]] = None
        custom_instructions: Optional[str] = None

    @app.get("/api/agents")
    def get_agents():
        return service.get_agent_list()

    @app.post("/api/agents/{agent_id}")
    def update_agent(agent_id: str, req: AgentUpdateRequest):
        return service.update_agent_config(agent_id, req.permitted_tools, req.custom_instructions)

    @app.get("/api/workspace/files")
    def get_workspace_files():
        return {
            "workspace_root": service.sandbox.workspace_root,
            "files": service.tools.fs.list_files(),
        }

    @app.get("/api/workspace/file")
    def get_workspace_file(path: str):
        try:
            content = service.tools.fs.read_file(path)
            return {"path": path, "content": content}
        except Exception as e:
            raise HTTPException(status_code=404, detail=str(e))

    @app.get("/api/tasks")
    def list_tasks():
        return [t.to_dict() for t in service.tasks.values()]

    @app.post("/api/tasks")
    def create_task(req: TaskCreateRequest):
        t = service.create_task(req.prompt, req.workspace_path)
        return t.to_dict()

    @app.get("/api/tasks/{task_id}")
    def get_task(task_id: str):
        t = service.tasks.get(task_id)
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        return t.to_dict()

    @app.post("/api/tasks/{task_id}/approve")
    def approve_task(task_id: str):
        t = service.tasks.get(task_id)
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        req = service.approvals.get_pending_by_task(task_id)
        if req:
            service.approvals.approve(req.approval_id)
        sm = service.state_machines[task_id]
        if sm.can_transition_to(TaskState.RUNNING):
            sm.transition(TaskState.RUNNING, reason="Human approved action")
            t.state = TaskState.RUNNING
            t.pending_approval = None
            # Resume workflow
            service.orchestrator.execute_workflow(t, sm)
        return t.to_dict()

    @app.post("/api/tasks/{task_id}/reject")
    def reject_task(task_id: str):
        t = service.tasks.get(task_id)
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        req = service.approvals.get_pending_by_task(task_id)
        if req:
            service.approvals.reject(req.approval_id)
        sm = service.state_machines[task_id]
        if sm.can_transition_to(TaskState.CANCELLED):
            sm.transition(TaskState.CANCELLED, reason="Human rejected action")
            t.state = TaskState.CANCELLED
            t.pending_approval = None
        return t.to_dict()

    @app.post("/api/tasks/{task_id}/cancel")
    def cancel_task(task_id: str):
        t = service.tasks.get(task_id)
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        sm = service.state_machines[task_id]
        if sm.can_transition_to(TaskState.CANCELLED):
            sm.transition(TaskState.CANCELLED, reason="User cancelled task")
            t.state = TaskState.CANCELLED
        return t.to_dict()

    @app.get("/api/tasks/{task_id}/events")
    def get_task_events(task_id: str):
        t = service.tasks.get(task_id)
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        return [e.to_dict() for e in t.events]

    @app.get("/api/tasks/{task_id}/diff")
    def get_task_diff(task_id: str):
        t = service.tasks.get(task_id)
        if not t:
            raise HTTPException(status_code=404, detail="Task not found")
        return {"task_id": task_id, "diff": t.diff}

    @app.get("/api/settings/privacy")
    def get_privacy_settings():
        return {
            "current_mode": service.privacy_mode.value,
            "available_modes": [m.value for m in PrivacyMode],
            "description": "Fail-closed privacy policy for LLM routing and network access.",
        }

    @app.post("/api/settings/privacy")
    def set_privacy_settings(req: PrivacyUpdateRequest):
        return service.update_privacy(req.privacy_mode)

    @app.get("/api/settings/policies")
    def get_policies():
        return service.policy.to_dict()

    @app.post("/api/settings/policies")
    def set_policies(req: PolicyUpdateRequest):
        return service.update_policy(req.policy_profile)

    # Universal AI Hub Endpoints
    class ProviderRegisterRequest(BaseModel):
        provider_id: str
        name: str
        api_base: str
        api_key: Optional[str] = ""
        is_local: Optional[bool] = False
        default_model: Optional[str] = "default-model"
        enabled: Optional[bool] = True

    class ProviderTestRequest(BaseModel):
        api_base: str
        api_key: Optional[str] = ""
        is_local: Optional[bool] = False

    @app.get("/api/hub/providers")
    def list_hub_providers():
        return service.models.list_all_providers()

    @app.post("/api/hub/providers")
    def register_hub_provider(req: ProviderRegisterRequest):
        return service.models.register_provider(
            provider_id=req.provider_id,
            name=req.name,
            api_base=req.api_base,
            api_key=req.api_key or "",
            is_local=bool(req.is_local),
            default_model=req.default_model or "default-model",
            enabled=bool(req.enabled),
        )

    @app.delete("/api/hub/providers/{provider_id}")
    def delete_hub_provider(provider_id: str):
        success = service.models.unregister_provider(provider_id)
        return {"status": "success" if success else "not_found", "provider_id": provider_id}

    @app.post("/api/hub/providers/test")
    def test_hub_provider(req: ProviderTestRequest):
        from backend.app.models.custom_provider import ConfigurableProvider
        temp_provider = ConfigurableProvider(
            provider_id="temp_test",
            name="Test Endpoint",
            api_base=req.api_base,
            api_key=req.api_key or "",
            is_local=bool(req.is_local),
        )
        is_up = temp_provider.is_available()
        models = [m.to_dict() for m in temp_provider.list_models()] if is_up else []
        return {
            "status": "online" if is_up else "offline",
            "is_available": is_up,
            "models_discovered": len(models),
            "models": models,
        }

    @app.get("/api/hub/coding-agents")
    def get_hub_coding_agents():
        return service.models.get_coding_agents()

    return app
