"""Freedom Agent Backend Server Entrypoint with dual FastAPI / Standard Library HTTP support."""
import os
import sys
import json
import urllib.parse
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler

from backend.app.core.config import get_settings, PrivacyMode, PolicyProfile
from backend.app.schemas.task import TaskState
from backend.app.api.routes import service

settings = get_settings()

# Try importing FastAPI if available
FASTAPI_AVAILABLE = False
app = None
try:
    import uvicorn
    from fastapi import FastAPI
    from backend.app.api.routes import build_fastapi_app
    app = build_fastapi_app()
    FASTAPI_AVAILABLE = True
except ImportError:
    FASTAPI_AVAILABLE = False


class FreedomHttpHandler(BaseHTTPRequestHandler):
    """Standard-library HTTP request handler providing identical REST API when FastAPI is uninstalled."""

    def handle(self):
        try:
            super().handle()
        except (ConnectionResetError, BrokenPipeError, ConnectionAbortedError):
            pass

    def _send_json(self, data, status_code=200):
        body = json.dumps(data).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")

        if path == "/api/health":
            self._send_json({
                "status": "healthy",
                "version": "0.1.0",
                "privacy_mode": service.privacy_mode.value,
                "policy_profile": service.policy.profile_name.value,
            })
        elif path == "/api/providers":
            self._send_json(service.models.get_provider_status())
        elif path == "/api/models":
            self._send_json([m.to_dict() for m in service.models.list_available_models()])
        elif path == "/api/agents":
            self._send_json(service.get_agent_list())
        elif path == "/api/workspace/files":
            self._send_json({
                "workspace_root": service.sandbox.workspace_root,
                "files": service.tools.fs.list_files(),
            })
        elif path == "/api/workspace/file":
            query = urllib.parse.parse_qs(parsed.query)
            file_path = query.get("path", [""])[0]
            try:
                content = service.tools.fs.read_file(file_path)
                self._send_json({"path": file_path, "content": content})
            except Exception as e:
                self._send_json({"detail": str(e)}, 404)
        elif path == "/api/tasks":
            self._send_json([t.to_dict() for t in service.tasks.values()])
        elif path.startswith("/api/tasks/"):
            parts = path.split("/")
            task_id = parts[3]
            task = service.tasks.get(task_id)
            if not task:
                self._send_json({"detail": "Task not found"}, 404)
                return
            if len(parts) == 4:
                self._send_json(task.to_dict())
            elif len(parts) == 5 and parts[4] == "events":
                self._send_json([e.to_dict() for e in task.events])
            elif len(parts) == 5 and parts[4] == "diff":
                self._send_json({"task_id": task_id, "diff": task.diff})
            else:
                self._send_json({"detail": "Not found"}, 404)
        elif path == "/api/settings/privacy":
            self._send_json({
                "current_mode": service.privacy_mode.value,
                "available_modes": [m.value for m in PrivacyMode],
                "description": "Fail-closed privacy policy for LLM routing and network access.",
            })
        elif path == "/api/settings/policies":
            self._send_json(service.policy.to_dict())
        elif path == "/api/hub/providers":
            self._send_json(service.models.list_all_providers())
        elif path == "/api/hub/coding-agents":
            self._send_json(service.models.get_coding_agents())
        else:
            self._send_json({"detail": "Endpoint not found"}, 404)

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        content_len = int(self.headers.get("Content-Length", 0))
        body_bytes = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            body = json.loads(body_bytes.decode("utf-8")) if body_bytes else {}
        except Exception:
            body = {}

        if path == "/api/tasks":
            prompt = body.get("prompt", "")
            workspace = body.get("workspace_path")
            task = service.create_task(prompt, workspace)
            self._send_json(task.to_dict(), 201)
        elif path.startswith("/api/tasks/"):
            parts = path.split("/")
            task_id = parts[3]
            task = service.tasks.get(task_id)
            if not task:
                self._send_json({"detail": "Task not found"}, 404)
                return
            action = parts[4] if len(parts) > 4 else ""
            if action == "approve":
                req = service.approvals.get_pending_by_task(task_id)
                if req:
                    service.approvals.approve(req.approval_id)
                sm = service.state_machines[task_id]
                if sm.can_transition_to(TaskState.RUNNING):
                    sm.transition(TaskState.RUNNING, reason="Human approved action")
                    task.state = TaskState.RUNNING
                    task.pending_approval = None
                    service.orchestrator.execute_workflow(task, sm)
                self._send_json(task.to_dict())
            elif action == "reject":
                req = service.approvals.get_pending_by_task(task_id)
                if req:
                    service.approvals.reject(req.approval_id)
                sm = service.state_machines[task_id]
                if sm.can_transition_to(TaskState.CANCELLED):
                    sm.transition(TaskState.CANCELLED, reason="Human rejected action")
                    task.state = TaskState.CANCELLED
                    task.pending_approval = None
                self._send_json(task.to_dict())
            elif action == "cancel":
                sm = service.state_machines[task_id]
                if sm.can_transition_to(TaskState.CANCELLED):
                    sm.transition(TaskState.CANCELLED, reason="User cancelled task")
                    task.state = TaskState.CANCELLED
                self._send_json(task.to_dict())
            else:
                self._send_json({"detail": "Unknown action"}, 400)
        elif path.startswith("/api/agents/"):
            parts = path.split("/")
            agent_id = parts[3]
            res = service.update_agent_config(
                agent_id=agent_id,
                permitted_tools=body.get("permitted_tools"),
                custom_instructions=body.get("custom_instructions")
            )
            self._send_json(res)
        elif path == "/api/settings/privacy":
            res = service.update_privacy(body.get("privacy_mode", "LOCAL_ONLY"))
            self._send_json(res)
        elif path == "/api/settings/policies":
            res = service.update_policy(body.get("policy_profile", "Developer"))
            self._send_json(res)
        elif path == "/api/hub/providers":
            res = service.models.register_provider(
                provider_id=body.get("provider_id", ""),
                name=body.get("name", "Custom Provider"),
                api_base=body.get("api_base", ""),
                api_key=body.get("api_key", ""),
                is_local=bool(body.get("is_local", False)),
                default_model=body.get("default_model", "default-model"),
                enabled=bool(body.get("enabled", True)),
            )
            self._send_json(res)
        elif path == "/api/hub/providers/test":
            from backend.app.models.custom_provider import ConfigurableProvider
            temp = ConfigurableProvider(
                provider_id="temp_test",
                name="Test Endpoint",
                api_base=body.get("api_base", ""),
                api_key=body.get("api_key", ""),
                is_local=bool(body.get("is_local", False)),
            )
            is_up = temp.is_available()
            models = [m.to_dict() for m in temp.list_models()] if is_up else []
            self._send_json({
                "status": "online" if is_up else "offline",
                "is_available": is_up,
                "models_discovered": len(models),
                "models": models,
            })
        else:
            self._send_json({"detail": "Endpoint not found"}, 404)

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip("/")
        if path.startswith("/api/hub/providers/"):
            pid = path.split("/")[-1]
            success = service.models.unregister_provider(pid)
            self._send_json({"status": "success" if success else "not_found", "provider_id": pid})
        else:
            self._send_json({"detail": "Endpoint not found"}, 404)

    def log_message(self, format, *args):
        # Clean logging
        pass


def main():
    print("=" * 60)
    print("FREEDOM AGENT: MULTI-AGENT RUNTIME")
    print(f"Privacy Mode: {settings.privacy_mode.value}")
    print(f"Policy Profile: {settings.policy_profile.value}")
    print(f"Workspace Root: {settings.workspace_root}")
    print(f"Server URL: http://{settings.host}:{settings.port}")
    if FASTAPI_AVAILABLE:
        print("Engine: FastAPI (uvicorn)")
    else:
        print("Engine: Standard Library ThreadingHTTPServer (Zero-Dependency)")
    print("=" * 60)

    if FASTAPI_AVAILABLE:
        uvicorn.run(
            "backend.app.main:app",
            host=settings.host,
            port=settings.port,
            reload=settings.debug,
        )
    else:
        ThreadingHTTPServer.allow_reuse_address = True
        server = ThreadingHTTPServer((settings.host, settings.port), FreedomHttpHandler)
        try:
            server.serve_forever()
        except (KeyboardInterrupt, SystemExit):
            pass
        finally:
            try:
                server.server_close()
            except Exception:
                pass


if __name__ == "__main__":
    main()
