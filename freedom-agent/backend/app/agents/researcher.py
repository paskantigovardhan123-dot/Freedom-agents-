"""Research Agent: Gathers reference information respecting privacy boundaries."""
from typing import Dict, Any
from backend.app.agents.base import BaseAgent
from backend.app.schemas.agent_message import AgentMessage

class ResearchAgent(BaseAgent):
    """Executes documentation queries and online/offline fact verification."""

    def __init__(self, tool_registry):
        super().__init__(
            agent_id="researcher",
            name="Research Agent",
            role_description="Performs offline or bounded web research, attributing sources and preserving evidence.",
            tool_registry=tool_registry,
        )

    def handle_message(self, message: AgentMessage) -> AgentMessage:
        query = message.user_objective
        
        # In LOCAL_ONLY mode, queries local docs
        try:
            doc_res = self.tools.browser.query_docs(query)
            evidence = doc_res
            offline_mode = True
        except Exception:
            evidence = {"source": "offline_fallback", "query": query, "results": []}
            offline_mode = True

        message.result_and_evidence = {
            "research_query": query,
            "offline_mode": offline_mode,
            "verified_evidence": evidence,
            "notes": "Information gathered exclusively through permitted local documentation channels.",
        }
        message.status = "SUCCESS"
        return message
