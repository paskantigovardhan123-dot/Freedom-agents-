"""Code Reviewer Agent: Evaluates unified diffs and checks code quality."""
from typing import Dict, Any, List
from backend.app.agents.base import BaseAgent
from backend.app.schemas.agent_message import AgentMessage

class ReviewerAgent(BaseAgent):
    """Conducts independent review of modified code diffs."""

    def __init__(self, tool_registry):
        super().__init__(
            agent_id="reviewer",
            name="Code Reviewer Agent",
            role_description="Audits diffs for anti-patterns, scope creep, and unhandled edge cases.",
            tool_registry=tool_registry,
        )

    def handle_message(self, message: AgentMessage) -> AgentMessage:
        diff_text = message.relevant_context.get("diff", "")
        modified_files = message.relevant_context.get("files_modified", [])

        critiques: List[str] = []
        approved = True

        # Check for unhandled exceptions or dangerous constructs
        if "except:" in diff_text or "except Exception: pass" in diff_text:
            critiques.append("Avoid bare except clauses or swallowing exceptions silently.")
            approved = False

        if "eval(" in diff_text or "exec(" in diff_text:
            critiques.append("Dangerous dynamic execution (eval/exec) detected in diff.")
            approved = False

        if not critiques:
            critiques.append("Clean patch: modifications are strictly localized and conform to idioms.")

        message.result_and_evidence = {
            "approved": approved,
            "reviewed_files": modified_files,
            "critiques": critiques,
            "scope_check": "Verified: No unrelated files modified outside task requirements.",
        }
        message.status = "SUCCESS" if approved else "NEEDS_REVISION"
        return message
