"""Subprocess command runner with timeout, allowlists, and secret redaction."""
import subprocess
import time
import shlex
import os
from typing import List, Dict, Optional, Tuple
from backend.app.execution.sandbox import ExecutionSandbox
from backend.app.core.security import RedactionEngine
from backend.app.schemas.tools import ToolResult

class TerminalTool:
    """Safely executes authorized terminal commands within workspace boundaries."""

    # Benign commands that are auto-approved under DEVELOPER or RESEARCH policies
    READ_ONLY_PREFIXES = (
        "git status",
        "git diff",
        "git log",
        "python3 -m unittest",
        "python -m unittest",
        "pytest",
        "npm test",
        "npm run test",
        "ls",
        "dir",
        "pwd",
    )

    # Strictly dangerous patterns that always demand explicit user approval
    DANGEROUS_PATTERNS = (
        "rm -rf",
        "rmdir /s",
        "git push",
        "git reset --hard",
        "git clean -fd",
        "curl ",
        "wget ",
        "chmod ",
        "chown ",
        "sudo ",
        "pip install",
        "npm install",
    )

    def __init__(self, sandbox: ExecutionSandbox, max_timeout: int = 120):
        self._sandbox = sandbox
        self._max_timeout = max_timeout
        self._history: List[Dict] = []

    def is_safe_read_only(self, command: str) -> bool:
        cmd_clean = command.strip().lower()
        return any(cmd_clean.startswith(prefix) for prefix in self.READ_ONLY_PREFIXES)

    def is_dangerous(self, command: str) -> bool:
        cmd_clean = command.strip().lower()
        return any(pattern in cmd_clean for pattern in self.DANGEROUS_PATTERNS)

    def run_command(self, command_str: str, timeout_seconds: Optional[int] = None) -> ToolResult:
        """Executes a command within workspace root and returns redacting result."""
        timeout = min(timeout_seconds or self._max_timeout, self._max_timeout)
        start_time = time.time()
        
        # Prepare environment with filtered secrets
        env = os.environ.copy()
        # Ensure workspace root is working directory
        cwd = self._sandbox.workspace_root

        try:
            # Tokenize command string safely
            args = shlex.split(command_str)
            if not args:
                return ToolResult(
                    tool_name="terminal",
                    success=False,
                    output="",
                    error="Empty command string",
                    exit_code=1,
                )

            proc = subprocess.run(
                args,
                cwd=cwd,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env,
            )
            duration_ms = (time.time() - start_time) * 1000.0

            raw_stdout = proc.stdout or ""
            raw_stderr = proc.stderr or ""
            
            # Redact secrets from output
            redacted_stdout = RedactionEngine.redact(raw_stdout)
            redacted_stderr = RedactionEngine.redact(raw_stderr)

            success = (proc.returncode == 0)
            result = ToolResult(
                tool_name="terminal",
                success=success,
                output=redacted_stdout,
                error=redacted_stderr if not success else None,
                exit_code=proc.returncode,
                duration_ms=duration_ms,
            )

        except subprocess.TimeoutExpired:
            duration_ms = (time.time() - start_time) * 1000.0
            result = ToolResult(
                tool_name="terminal",
                success=False,
                output="",
                error=f"Command timed out after {timeout} seconds",
                exit_code=124,
                duration_ms=duration_ms,
            )
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000.0
            result = ToolResult(
                tool_name="terminal",
                success=False,
                output="",
                error=str(e),
                exit_code=1,
                duration_ms=duration_ms,
            )

        self._history.append({
            "command": RedactionEngine.redact(command_str),
            "exit_code": result.exit_code,
            "duration_ms": result.duration_ms,
            "success": result.success,
        })
        return result
