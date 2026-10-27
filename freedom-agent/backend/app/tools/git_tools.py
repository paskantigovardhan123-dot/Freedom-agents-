"""Safe Git repository inspection and staging operations."""
from typing import Dict, Any, Optional
from backend.app.tools.terminal import TerminalTool

class GitTools:
    """Manages Git interactions under strict approval boundaries."""

    def __init__(self, terminal: TerminalTool):
        self._terminal = terminal

    def status(self) -> Dict[str, Any]:
        res = self._terminal.run_command("git status --short")
        return {
            "is_git": res.success,
            "raw_status": res.output,
            "has_changes": bool(res.output.strip()),
        }

    def diff(self, cached: bool = False) -> str:
        cmd = "git diff --cached" if cached else "git diff"
        res = self._terminal.run_command(cmd)
        return res.output if res.success else ""

    def branch(self, branch_name: str) -> bool:
        res = self._terminal.run_command(f"git checkout -b {branch_name}")
        return res.success

    def stage(self, file_path: str = ".") -> bool:
        res = self._terminal.run_command(f"git add {file_path}")
        return res.success

    def commit(self, message: str) -> Dict[str, Any]:
        """Commits changes. NOTE: Higher orchestration layers require explicit human approval before calling this."""
        safe_msg = message.replace('"', '\\"')
        res = self._terminal.run_command(f'git commit -m "{safe_msg}"')
        return {
            "success": res.success,
            "output": res.output,
            "error": res.error,
        }
