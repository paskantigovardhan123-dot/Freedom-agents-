"""Task and Workflow data models."""
from enum import Enum
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
import datetime

class TaskState(str, Enum):
    PENDING = "PENDING"
    PLANNING = "PLANNING"
    WAITING_FOR_APPROVAL = "WAITING_FOR_APPROVAL"
    RUNNING = "RUNNING"
    VERIFYING = "VERIFYING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    NEEDS_INPUT = "NEEDS_INPUT"
    BLOCKED = "BLOCKED"

@dataclass
class TaskEvent:
    event_id: str
    task_id: str
    event_type: str
    message: str
    payload: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "event_id": self.event_id,
            "task_id": self.task_id,
            "event_type": self.event_type,
            "message": self.message,
            "payload": self.payload,
            "timestamp": self.timestamp,
        }

@dataclass
class ApprovalRequest:
    approval_id: str
    task_id: str
    action_type: str  # e.g., "TERMINAL_COMMAND", "FILE_DELETE", "GIT_COMMIT"
    description: str
    details: Dict[str, Any]
    status: str = "PENDING"  # PENDING, APPROVED, REJECTED
    created_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())
    resolved_at: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "approval_id": self.approval_id,
            "task_id": self.task_id,
            "action_type": self.action_type,
            "description": self.description,
            "details": self.details,
            "status": self.status,
            "created_at": self.created_at,
            "resolved_at": self.resolved_at,
        }

@dataclass
class TaskItem:
    task_id: str
    title: str
    prompt: str
    workspace_path: str
    state: TaskState = TaskState.PENDING
    plan_steps: List[str] = field(default_factory=list)
    active_agent: Optional[str] = None
    assigned_model: Optional[str] = None
    retry_count: int = 0
    max_retries: int = 3
    error_message: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())
    updated_at: str = field(default_factory=lambda: datetime.datetime.utcnow().isoformat())
    diff: str = ""
    events: List[TaskEvent] = field(default_factory=list)
    pending_approval: Optional[ApprovalRequest] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "task_id": self.task_id,
            "title": self.title,
            "prompt": self.prompt,
            "workspace_path": self.workspace_path,
            "state": self.state.value if isinstance(self.state, TaskState) else self.state,
            "plan_steps": self.plan_steps,
            "active_agent": self.active_agent,
            "assigned_model": self.assigned_model,
            "retry_count": self.retry_count,
            "max_retries": self.max_retries,
            "error_message": self.error_message,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "diff": self.diff,
            "has_pending_approval": self.pending_approval is not None,
            "pending_approval": self.pending_approval.to_dict() if self.pending_approval else None,
        }
