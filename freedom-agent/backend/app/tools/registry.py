"""Modular Tool Registry with policy authorization and audit recording."""
from typing import Dict, Any, List, Optional
import time
from backend.app.schemas.tools import ToolDefinition, ToolResult
from backend.app.schemas.policies import ModelPolicy
from backend.app.tools.filesystem import FileSystemTools
from backend.app.tools.terminal import TerminalTool
from backend.app.tools.git_tools import GitTools
from backend.app.tools.test_runner import TestRunnerTool
from backend.app.tools.browser import BrowserTool
from backend.app.execution.approvals import ApprovalManager
from backend.app.execution.sandbox import ExecutionSandbox

class ToolRegistry:
    """Central registry and policy gatekeeper for all tool invocations."""

    def __init__(
        self,
        sandbox: ExecutionSandbox,
        approvals: ApprovalManager,
        policy: ModelPolicy,
    ):
        self._sandbox = sandbox
        self._approvals = approvals
        self._policy = policy

        self.fs = FileSystemTools(sandbox)
        self.terminal = TerminalTool(sandbox, max_timeout=policy.max_task_duration_seconds)
        self.git = GitTools(self.terminal)
        self.test_runner = TestRunnerTool(sandbox, self.terminal)
        self.browser = BrowserTool(privacy_mode=policy.privacy_mode)
        
        self._audit_log: List[Dict[str, Any]] = []

    def execute_tool(
        self,
        agent_id: str,
        tool_name: str,
        arguments: Dict[str, Any],
        task_id: str = "",
    ) -> ToolResult:
        """Executes a tool after verifying agent permissions and policy boundaries."""
        start_time = time.time()

        # 1. Check agent permission allowlist
        allowed_tools = self._policy.agent_tool_allowlist.get(agent_id, [])
        if allowed_tools and tool_name not in allowed_tools:
            return ToolResult(
                tool_name=tool_name,
                success=False,
                output="",
                error=f"Permission denied: Agent '{agent_id}' is not authorized to use tool '{tool_name}'",
                exit_code=403,
            )

        # 2. Check if dangerous command / commit requires approval
        if tool_name == "run_command":
            cmd = arguments.get("command", "")
            is_dangerous = self.terminal.is_dangerous(cmd)
            is_read_only = self.terminal.is_safe_read_only(cmd)
            
            if (self._policy.require_approval_for_commands and not is_read_only) or is_dangerous:
                # Check if already approved
                req = self._approvals.get_pending_by_task(task_id)
                if not req or req.status != "APPROVED":
                    self._approvals.request_approval(
                        task_id=task_id,
                        action_type="TERMINAL_COMMAND",
                        description=f"Run command: {cmd}",
                        details={"command": cmd},
                    )
                    return ToolResult(
                        tool_name=tool_name,
                        success=False,
                        output="",
                        error="Action paused: Requires human approval via dashboard or API",
                        exit_code=401,
                    )

        if tool_name == "git_commit" and self._policy.require_approval_for_git_commits:
            req = self._approvals.get_pending_by_task(task_id)
            if not req or req.status != "APPROVED":
                self._approvals.request_approval(
                    task_id=task_id,
                    action_type="GIT_COMMIT",
                    description=f"Create commit: {arguments.get('message', '')}",
                    details=arguments,
                )
                return ToolResult(
                    tool_name=tool_name,
                    success=False,
                    output="",
                    error="Action paused: Git commit requires human approval",
                    exit_code=401,
                )

        # 3. Dispatch to tool handler
        try:
            if tool_name == "list_files":
                files = self.fs.list_files(arguments.get("sub_dir", ""))
                res = ToolResult(tool_name=tool_name, success=True, output="\n".join(files))
            elif tool_name == "read_file":
                content = self.fs.read_file(arguments["file_path"])
                res = ToolResult(tool_name=tool_name, success=True, output=content)
            elif tool_name == "write_file":
                diff = self.fs.write_file(arguments["file_path"], arguments["content"])
                res = ToolResult(tool_name=tool_name, success=True, output=f"Updated {arguments['file_path']}", diff=diff)
            elif tool_name == "apply_patch":
                diff = self.fs.apply_patch(arguments["file_path"], arguments["target_block"], arguments["replacement_block"])
                res = ToolResult(tool_name=tool_name, success=True, output=f"Patched {arguments['file_path']}", diff=diff)
            elif tool_name == "search_files":
                matches = self.fs.search_files(arguments["query"], arguments.get("sub_dir", ""))
                res = ToolResult(tool_name=tool_name, success=True, output=str(matches))
            elif tool_name == "run_command":
                res = self.terminal.run_command(arguments["command"])
            elif tool_name == "run_tests":
                test_res = self.test_runner.run_tests(arguments.get("test_filter", ""))
                res = ToolResult(
                    tool_name=tool_name,
                    success=test_res["success"],
                    output=test_res["output"],
                    exit_code=test_res["exit_code"],
                )
            elif tool_name == "git_status":
                status = self.git.status()
                res = ToolResult(tool_name=tool_name, success=True, output=str(status))
            elif tool_name == "git_diff":
                diff_out = self.git.diff()
                res = ToolResult(tool_name=tool_name, success=True, output=diff_out)
            elif tool_name == "git_commit":
                c_res = self.git.commit(arguments["message"])
                res = ToolResult(tool_name=tool_name, success=c_res["success"], output=c_res["output"], error=c_res.get("error"))
            elif tool_name == "query_local_docs":
                doc_res = self.browser.query_docs(arguments["query"])
                res = ToolResult(tool_name=tool_name, success=True, output=str(doc_res))
            elif tool_name == "web_search":
                search_res = self.browser.web_search(arguments["query"])
                res = ToolResult(tool_name=tool_name, success=True, output=str(search_res))
            else:
                res = ToolResult(tool_name=tool_name, success=False, output="", error=f"Unknown tool: '{tool_name}'", exit_code=404)

        except Exception as e:
            res = ToolResult(tool_name=tool_name, success=False, output="", error=str(e), exit_code=500)

        res.duration_ms = (time.time() - start_time) * 1000.0
        self._audit_log.append({
            "task_id": task_id,
            "agent_id": agent_id,
            "tool_name": tool_name,
            "arguments": arguments,
            "success": res.success,
            "duration_ms": res.duration_ms,
        })
        return res

    def get_audit_log(self) -> List[Dict[str, Any]]:
        return list(self._audit_log)
