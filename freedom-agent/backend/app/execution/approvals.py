"""Interactive human-in-the-loop approval management."""
from typing import Dict, Optional, List
import datetime
from backend.app.schemas.task import ApprovalRequest
from backend.app.core.security import generate_secure_id

class ApprovalManager:
    """Tracks and validates human approvals for destructive or high-risk actions."""

    def __init__(self):
        self._approvals: Dict[str, ApprovalRequest] = {}

    def request_approval(
        self,
        task_id: str,
        action_type: str,
        description: str,
        details: Dict,
    ) -> ApprovalRequest:
        approval_id = generate_secure_id("appr")
        req = ApprovalRequest(
            approval_id=approval_id,
            task_id=task_id,
            action_type=action_type,
            description=description,
            details=details,
            status="PENDING",
        )
        self._approvals[approval_id] = req
        return req

    def get_approval(self, approval_id: str) -> Optional[ApprovalRequest]:
        return self._approvals.get(approval_id)

    def get_pending_by_task(self, task_id: str) -> Optional[ApprovalRequest]:
        for req in self._approvals.values():
            if req.task_id == task_id and req.status == "PENDING":
                return req
        return None

    def approve(self, approval_id: str) -> ApprovalRequest:
        req = self._approvals.get(approval_id)
        if not req:
            raise KeyError(f"Approval request '{approval_id}' not found")
        req.status = "APPROVED"
        req.resolved_at = datetime.datetime.utcnow().isoformat()
        return req

    def reject(self, approval_id: str) -> ApprovalRequest:
        req = self._approvals.get(approval_id)
        if not req:
            raise KeyError(f"Approval request '{approval_id}' not found")
        req.status = "REJECTED"
        req.resolved_at = datetime.datetime.utcnow().isoformat()
        return req

    def list_pending(self) -> List[ApprovalRequest]:
        return [r for r in self._approvals.values() if r.status == "PENDING"]
