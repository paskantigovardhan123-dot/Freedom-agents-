"""Automated test framework discovery and execution."""
import os
import re
from typing import Dict, Any, List
from backend.app.execution.sandbox import ExecutionSandbox
from backend.app.tools.terminal import TerminalTool

class TestRunnerTool:
    """Discovers tests in Python or Node.js workspaces and parses outcomes."""

    def __init__(self, sandbox: ExecutionSandbox, terminal: TerminalTool):
        self._sandbox = sandbox
        self._terminal = terminal

    def discover_test_framework(self) -> str:
        """Detects whether workspace uses pytest, unittest, or npm test."""
        ws = self._sandbox.workspace_root
        
        # Check Node.js
        if os.path.exists(os.path.join(ws, "package.json")):
            return "npm"
            
        # Check Pytest config or test files
        if os.path.exists(os.path.join(ws, "pytest.ini")) or os.path.exists(os.path.join(ws, "setup.cfg")):
            return "pytest"

        # Search for test_*.py files
        has_tests = False
        for root, _, files in os.walk(ws):
            if any(f.startswith("test_") and f.endswith(".py") for f in files):
                has_tests = True
                break
        
        if has_tests:
            return "unittest"
        return "none"

    def run_tests(self, test_filter: str = "") -> Dict[str, Any]:
        framework = self.discover_test_framework()
        if framework == "pytest":
            cmd = f"pytest {test_filter}".strip()
        elif framework == "unittest":
            cmd = f"python3 -m unittest discover -s . -p 'test_*.py'"
        elif framework == "npm":
            cmd = "npm test"
        else:
            return {
                "framework": "none",
                "success": False,
                "passed": 0,
                "failed": 0,
                "skipped": 0,
                "output": "No supported test suite detected in workspace",
            }

        result = self._terminal.run_command(cmd)
        raw_output = (result.output or "") + "\n" + (result.error or "")

        # Parse test metrics
        passed = 0
        failed = 0
        skipped = 0

        # Match unittest pattern e.g. "Ran 4 tests in 0.002s\n\nOK"
        ran_match = re.search(r"Ran (\d+) tests?", raw_output)
        if ran_match:
            total_ran = int(ran_match.group(1))
            fail_match = re.search(r"FAILED \((?:failures=(\d+))?(?:, )?(?:errors=(\d+))?\)", raw_output)
            if fail_match:
                f_count = int(fail_match.group(1) or 0) + int(fail_match.group(2) or 0)
                failed = f_count
                passed = max(0, total_ran - failed)
            elif "OK" in raw_output:
                passed = total_ran

        # Match pytest pattern e.g. "2 passed, 1 failed, 1 skipped"
        py_passed = re.search(r"(\d+)\s+passed", raw_output)
        if py_passed:
            passed = int(py_passed.group(1))
        py_failed = re.search(r"(\d+)\s+failed", raw_output)
        if py_failed:
            failed = int(py_failed.group(1))
        py_skipped = re.search(r"(\d+)\s+skipped", raw_output)
        if py_skipped:
            skipped = int(py_skipped.group(1))

        return {
            "framework": framework,
            "command": cmd,
            "exit_code": result.exit_code,
            "success": result.success,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "output": raw_output.strip(),
            "duration_ms": result.duration_ms,
        }
