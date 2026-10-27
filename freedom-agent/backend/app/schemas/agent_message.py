"""Agent internal typed message schemas."""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import datetime

@dataclass
class AgentMessage:
    task_id: str
    sender_agent_id: str
    recipient_agent_id: str
    user_objective: str
    parent_task_id: Optional[str] = None
    relevant_context: Dict[str, Any] = field(default_factory=dict)
    file_references: List[str] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    acceptance_criteria: List[str] = field(default_factory=list)
    proposed_tool_calls: List[Dict[str, Any]] = field(default_factory=list)
    result_and_evidence: Optional[Dict[str, Any]] = None
    status: str = "PENDING"
    created_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "parent_task_id": self.parent_task_id,
            "sender_agent_id": self.sender_agent_id,
            "recipient_agent_id": self.recipient_agent_id,
            "user_objective": self.user_objective,
            "relevant_context": self.relevant_context,
            "file_references": self.file_references,
            "constraints": self.constraints,
            "acceptance_criteria": self.acceptance_criteria,
            "proposed_tool_calls": self.proposed_tool_calls,
            "result_and_evidence": self.result_and_evidence,
            "status": self.status,
            "created_at": self.created_at,
        }
