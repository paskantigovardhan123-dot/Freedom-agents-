"""Tool execution, unified diff, and approval checking tests."""
import unittest
import tempfile
import os
import shutil

from backend.app.execution.sandbox import ExecutionSandbox
from backend.app.execution.approvals import ApprovalManager
from backend.app.schemas.policies import ModelPolicy, PolicyProfile
from backend.app.core.config import PrivacyMode
from backend.app.tools.registry import ToolRegistry
from backend.app.tools.filesystem import FileSystemTools

class TestToolsAndRedaction(unittest.TestCase):
    def setUp(self):
        self.temp_ws = tempfile.mkdtemp(prefix="fa_test_tools_")
        self.sandbox = ExecutionSandbox(workspace_root=self.temp_ws)
        self.approvals = ApprovalManager()
        self.policy = ModelPolicy.get_preset(PolicyProfile.DEVELOPER, PrivacyMode.LOCAL_ONLY)
        self.registry = ToolRegistry(self.sandbox, self.approvals, self.policy)
        self.fs = FileSystemTools(self.sandbox)

    def tearDown(self):
        shutil.rmtree(self.temp_ws, ignore_errors=True)

    def test_file_write_and_diff(self):
        diff = self.fs.write_file("hello.txt", "line 1\nline 2\n")
        self.assertTrue(os.path.exists(os.path.join(self.temp_ws, "hello.txt")))
        self.assertIn("+line 1", diff)

        # Modify line 2
        diff2 = self.fs.write_file("hello.txt", "line 1\nline 2 modified\n")
        self.assertIn("-line 2", diff2)
        self.assertIn("+line 2 modified", diff2)

    def test_apply_patch(self):
        self.fs.write_file("math.py", "def calc():\n    return 42\n")
        diff = self.fs.apply_patch("math.py", "return 42", "return 100")
        content = self.fs.read_file("math.py")
        self.assertIn("return 100", content)
        self.assertIn("-    return 42", diff)

    def test_unauthorized_tool_call_rejected(self):
        # Developer agent is not authorized to call "web_search"
        res = self.registry.execute_tool(
            agent_id="developer",
            tool_name="web_search",
            arguments={"query": "test"},
        )
        self.assertFalse(res.success)
        self.assertEqual(res.exit_code, 403)
        self.assertIn("Permission denied", res.error)

    def test_dangerous_command_requires_approval(self):
        res = self.registry.execute_tool(
            agent_id="developer",
            tool_name="run_command",
            arguments={"command": "rm -rf some_dir"},
            task_id="tsk_test_01",
        )
        self.assertFalse(res.success)
        self.assertEqual(res.exit_code, 401)
        self.assertIn("Requires human approval", res.error)
        
        # Verify approval request was recorded
        pending = self.approvals.get_pending_by_task("tsk_test_01")
        self.assertIsNotNone(pending)
        self.assertEqual(pending.action_type, "TERMINAL_COMMAND")

if __name__ == "__main__":
    unittest.main()
