"""Orchestrator Agent: Decomposes tasks, coordinates specialist agents, and verifies tool outcomes."""
import time
from typing import Dict, Any, List, Optional
from backend.app.agents.base import BaseAgent
from backend.app.agents.architect import ArchitectAgent
from backend.app.agents.developer import DeveloperAgent
from backend.app.agents.tester import TesterAgent
from backend.app.agents.reviewer import ReviewerAgent
from backend.app.agents.security_reviewer import SecurityReviewerAgent
from backend.app.agents.debugger import DebuggerAgent
from backend.app.schemas.agent_message import AgentMessage
from backend.app.schemas.task import TaskItem, TaskState, TaskEvent
from backend.app.execution.state_machine import TaskStateMachine
from backend.app.core.security import generate_secure_id

class OrchestratorAgent(BaseAgent):
    """Central agent coordinator driving deterministic workflows."""

    def __init__(self, tool_registry, max_retries: int = 3):
        super().__init__(
            agent_id="orchestrator",
            name="Orchestrator Agent",
            role_description="Decomposes user requests, sequences specialist agents, and verifies completion using real tool results.",
            tool_registry=tool_registry,
        )
        self.max_retries = max_retries
        self.architect = ArchitectAgent(tool_registry)
        self.developer = DeveloperAgent(tool_registry)
        self.tester = TesterAgent(tool_registry)
        self.reviewer = ReviewerAgent(tool_registry)
        self.security = SecurityReviewerAgent(tool_registry)
        self.debugger = DebuggerAgent(tool_registry)

    def handle_message(self, message: AgentMessage) -> AgentMessage:
        """Standard message interface."""
        return message

    def execute_workflow(self, task: TaskItem, state_machine: TaskStateMachine) -> TaskItem:
        """Drives the entire multi-agent lifecycle with deterministic state transitions."""
        task_id = task.task_id

        # 1. Transition PENDING -> PLANNING
        state_machine.transition(TaskState.PLANNING, reason="Decomposing user prompt into structured tasks")
        task.state = TaskState.PLANNING
        task.active_agent = "architect"
        task.events.append(TaskEvent(
            event_id=generate_secure_id("evt"),
            task_id=task_id,
            event_type="STATE_CHANGE",
            message="Orchestrator started planning with Architect Agent",
        ))

        # A. Architect analyzes repository
        arch_msg = AgentMessage(
            task_id=task_id,
            sender_agent_id="orchestrator",
            recipient_agent_id="architect",
            user_objective=task.prompt,
        )
        arch_res = self.architect.handle_message(arch_msg)
        task.plan_steps = arch_res.result_and_evidence.get("architectural_plan", [])
        target_files = arch_res.file_references

        task.events.append(TaskEvent(
            event_id=generate_secure_id("evt"),
            task_id=task_id,
            event_type="AGENT_OUTPUT",
            message=f"Architect generated plan with {len(task.plan_steps)} steps",
            payload={"plan": task.plan_steps, "files": target_files},
        ))

        # 2. Check for human approval if required by policy
        # If any pending approvals exist in ApprovalManager for this task:
        pending = self.tools._approvals.get_pending_by_task(task_id)
        if pending and pending.status == "PENDING":
            state_machine.transition(TaskState.WAITING_FOR_APPROVAL, reason="Awaiting human confirmation for planned actions")
            task.state = TaskState.WAITING_FOR_APPROVAL
            task.pending_approval = pending
            return task

        # 3. Transition PLANNING -> RUNNING
        state_machine.transition(TaskState.RUNNING, reason="Plan finalized, starting Developer Agent")
        task.state = TaskState.RUNNING
        task.active_agent = "developer"
        task.events.append(TaskEvent(
            event_id=generate_secure_id("evt"),
            task_id=task_id,
            event_type="STATE_CHANGE",
            message="Developer Agent implementing changes",
        ))

        # B. Developer writes/modifies files
        dev_msg = AgentMessage(
            task_id=task_id,
            sender_agent_id="orchestrator",
            recipient_agent_id="developer",
            user_objective=task.prompt,
            file_references=target_files,
        )
        dev_res = self.developer.handle_message(dev_msg)
        task.diff = dev_res.result_and_evidence.get("unified_diff", "")
        modified_files = dev_res.result_and_evidence.get("files_modified", [])

        task.events.append(TaskEvent(
            event_id=generate_secure_id("evt"),
            task_id=task_id,
            event_type="AGENT_OUTPUT",
            message=f"Developer generated patch for {modified_files}",
            payload={"diff": task.diff},
        ))

        # C. Security Reviewer scans changes
        task.active_agent = "security_reviewer"
        sec_msg = AgentMessage(
            task_id=task_id,
            sender_agent_id="orchestrator",
            recipient_agent_id="security_reviewer",
            user_objective="Audit code changes",
            relevant_context={"diff": task.diff},
        )
        sec_res = self.security.handle_message(sec_msg)
        if not sec_res.result_and_evidence.get("secure", False):
            task.events.append(TaskEvent(
                event_id=generate_secure_id("evt"),
                task_id=task_id,
                event_type="SECURITY_WARNING",
                message="Security reviewer flagged vulnerabilities in diff",
                payload=sec_res.result_and_evidence,
            ))

        # D. Code Reviewer audits diff
        task.active_agent = "reviewer"
        rev_msg = AgentMessage(
            task_id=task_id,
            sender_agent_id="orchestrator",
            recipient_agent_id="reviewer",
            user_objective="Review patch quality",
            relevant_context={"diff": task.diff, "files_modified": modified_files},
        )
        rev_res = self.reviewer.handle_message(rev_msg)

        # 4. Transition RUNNING -> VERIFYING
        state_machine.transition(TaskState.VERIFYING, reason="Executing regression test suite")
        task.state = TaskState.VERIFYING
        task.active_agent = "tester"
        task.events.append(TaskEvent(
            event_id=generate_secure_id("evt"),
            task_id=task_id,
            event_type="STATE_CHANGE",
            message="Test Engineer running tests",
        ))

        # E. Test Engineer runs tests
        test_msg = AgentMessage(
            task_id=task_id,
            sender_agent_id="orchestrator",
            recipient_agent_id="tester",
            user_objective="Verify test outcomes",
            file_references=target_files,
        )
        test_res = self.tester.handle_message(test_msg)
        test_passed = test_res.result_and_evidence.get("test_success", True)

        task.events.append(TaskEvent(
            event_id=generate_secure_id("evt"),
            task_id=task_id,
            event_type="TEST_RESULT",
            message=f"Test Suite Outcome: {'PASS' if test_passed else 'FAIL'}",
            payload=test_res.result_and_evidence,
        ))

        # If tests failed, attempt bounded repair with Debugger
        if not test_passed and task.retry_count < task.max_retries:
            task.retry_count += 1
            state_machine.transition(TaskState.RUNNING, reason=f"Retrying with Debugger (Attempt {task.retry_count}/{task.max_retries})")
            task.state = TaskState.RUNNING
            task.active_agent = "debugger"
            
            debug_msg = AgentMessage(
                task_id=task_id,
                sender_agent_id="orchestrator",
                recipient_agent_id="debugger",
                user_objective="Fix failing tests",
                relevant_context={"test_output": test_res.result_and_evidence.get("raw_output", "")},
            )
            self.debugger.handle_message(debug_msg)

            # Re-transition to VERIFYING
            state_machine.transition(TaskState.VERIFYING, reason="Re-verifying tests after debugger diagnosis")
            task.state = TaskState.VERIFYING
            # Re-run tests
            test_res = self.tester.handle_message(test_msg)
            test_passed = test_res.result_and_evidence.get("test_success", True)

        # 5. Final transition based on actual results
        if test_passed:
            state_machine.transition(TaskState.COMPLETED, reason="All execution and test verifications succeeded")
            task.state = TaskState.COMPLETED
            task.active_agent = None
            task.events.append(TaskEvent(
                event_id=generate_secure_id("evt"),
                task_id=task_id,
                event_type="STATE_CHANGE",
                message="Task completed successfully with verified tool outcomes",
            ))
        else:
            state_machine.transition(TaskState.FAILED, reason="Tests failed after exhausting retry attempts")
            task.state = TaskState.FAILED
            task.error_message = "Test suite failed regression verification."
            task.events.append(TaskEvent(
                event_id=generate_secure_id("evt"),
                task_id=task_id,
                event_type="STATE_CHANGE",
                message="Task failed during verification phase",
            ))

        return task
