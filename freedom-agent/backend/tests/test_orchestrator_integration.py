"""End-to-end integration tests for multi-agent orchestration."""
import unittest
import tempfile
import os
import shutil

from backend.app.execution.sandbox import ExecutionSandbox
from backend.app.execution.approvals import ApprovalManager
from backend.app.schemas.policies import ModelPolicy, PolicyProfile
from backend.app.core.config import PrivacyMode
from backend.app.tools.registry import ToolRegistry
from backend.app.agents.orchestrator import OrchestratorAgent
from backend.app.schemas.task import TaskItem, TaskState
from backend.app.execution.state_machine import TaskStateMachine

class TestOrchestratorIntegration(unittest.TestCase):
    def setUp(self):
        self.temp_ws = tempfile.mkdtemp(prefix="fa_test_orch_")
        self.sandbox = ExecutionSandbox(workspace_root=self.temp_ws)
        self.approvals = ApprovalManager()
        self.policy = ModelPolicy.get_preset(PolicyProfile.DEVELOPER, PrivacyMode.LOCAL_ONLY)
        self.registry = ToolRegistry(self.sandbox, self.approvals, self.policy)
        self.orchestrator = OrchestratorAgent(self.registry)

        # Create sample calculator file in workspace
        calc_file = os.path.join(self.temp_ws, "calculator.py")
        with open(calc_file, "w") as f:
            f.write("def add(a, b):\n    return a + b\n")

    def tearDown(self):
        shutil.rmtree(self.temp_ws, ignore_errors=True)

    def test_full_orchestration_cycle(self):
        task = TaskItem(
            task_id="task_test_cycle",
            title="Add power function",
            prompt="Add power(base, exponent) function to calculator.py",
            workspace_path=self.temp_ws,
            state=TaskState.PENDING,
        )
        sm = TaskStateMachine()

        result_task = self.orchestrator.execute_workflow(task, sm)

        # Check that state machine reached COMPLETED
        self.assertEqual(result_task.state, TaskState.COMPLETED)
        self.assertGreater(len(result_task.plan_steps), 0)
        self.assertTrue(bool(result_task.diff))
        
        # Verify file content on disk in the sandbox
        with open(os.path.join(self.temp_ws, "calculator.py")) as f:
            content = f.read()
        self.assertIn("def power", content)

if __name__ == "__main__":
    unittest.main()
