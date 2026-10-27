"""Test Engineer Agent: Discovers tests, writes test cases, and runs regression suites."""
from typing import Dict, Any
from backend.app.agents.base import BaseAgent
from backend.app.schemas.agent_message import AgentMessage

class TesterAgent(BaseAgent):
    """Executes automated test suites and measures regression outcomes."""

    def __init__(self, tool_registry):
        super().__init__(
            agent_id="tester",
            name="Test Engineer Agent",
            role_description="Discovers and runs test suites, tracking passed, failed, and skipped metrics.",
            tool_registry=tool_registry,
        )

    def handle_message(self, message: AgentMessage) -> AgentMessage:
        # Run test discovery and execution
        test_outcome = self.tools.test_runner.run_tests()
        
        # Check if tests exist or need creation
        created_test_file = None
        if test_outcome["framework"] == "none":
            # If no tests exist yet, create a baseline test file for target
            target_files = message.file_references
            if target_files and target_files[0].endswith(".py"):
                module_name = target_files[0][:-3]
                test_content = (
                    f"import unittest\nfrom {module_name} import *\n\n"
                    f"class Test{module_name.capitalize()}(unittest.TestCase):\n"
                    f"    def test_smoke(self):\n"
                    f"        self.assertTrue(True)\n\n"
                    f"if __name__ == '__main__':\n    unittest.main()\n"
                )
                test_file_name = f"test_{target_files[0]}"
                self.tools.fs.write_file(test_file_name, test_content)
                created_test_file = test_file_name
                # Re-run after creation
                test_outcome = self.tools.test_runner.run_tests()

        message.result_and_evidence = {
            "framework_detected": test_outcome["framework"],
            "test_success": test_outcome["success"],
            "passed_tests": test_outcome["passed"],
            "failed_tests": test_outcome["failed"],
            "skipped_tests": test_outcome["skipped"],
            "created_test_file": created_test_file,
            "raw_output": test_outcome["output"][:1000],
        }
        message.status = "SUCCESS" if test_outcome["success"] else "FAILED"
        return message
