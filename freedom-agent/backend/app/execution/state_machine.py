"""Deterministic Task Execution State Machine."""
from typing import Set, Dict, List, Optional
import datetime
from backend.app.schemas.task import TaskState

class InvalidStateTransitionError(Exception):
    """Raised when an illegal state transition is attempted."""
    pass

class TaskStateMachine:
    """Enforces deterministic state transitions for tasks."""

    # Legal state transition graph
    LEGAL_TRANSITIONS: Dict[TaskState, Set[TaskState]] = {
        TaskState.PENDING: {
            TaskState.PLANNING,
            TaskState.CANCELLED,
            TaskState.FAILED,
        },
        TaskState.PLANNING: {
            TaskState.WAITING_FOR_APPROVAL,
            TaskState.RUNNING,
            TaskState.NEEDS_INPUT,
            TaskState.FAILED,
            TaskState.CANCELLED,
        },
        TaskState.WAITING_FOR_APPROVAL: {
            TaskState.RUNNING,
            TaskState.CANCELLED,
            TaskState.FAILED,
            TaskState.PLANNING,
        },
        TaskState.RUNNING: {
            TaskState.VERIFYING,
            TaskState.WAITING_FOR_APPROVAL,
            TaskState.BLOCKED,
            TaskState.NEEDS_INPUT,
            TaskState.FAILED,
            TaskState.CANCELLED,
        },
        TaskState.VERIFYING: {
            TaskState.COMPLETED,
            TaskState.RUNNING,  # Debugger / retry on test failure
            TaskState.FAILED,
            TaskState.CANCELLED,
        },
        TaskState.BLOCKED: {
            TaskState.RUNNING,
            TaskState.FAILED,
            TaskState.CANCELLED,
        },
        TaskState.NEEDS_INPUT: {
            TaskState.PLANNING,
            TaskState.RUNNING,
            TaskState.CANCELLED,
        },
        TaskState.COMPLETED: set(),  # Terminal state
        TaskState.FAILED: {
            TaskState.PENDING,  # Explicit retry / reset
        },
        TaskState.CANCELLED: {
            TaskState.PENDING,  # Explicit restart
        },
    }

    def __init__(self, initial_state: TaskState = TaskState.PENDING):
        self._current_state = initial_state
        self._history: List[Dict[str, str]] = [{
            "from_state": "",
            "to_state": initial_state.value,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "reason": "Initial creation",
        }]

    @property
    def current_state(self) -> TaskState:
        return self._current_state

    @property
    def history(self) -> List[Dict[str, str]]:
        return list(self._history)

    def can_transition_to(self, target_state: TaskState) -> bool:
        allowed = self.LEGAL_TRANSITIONS.get(self._current_state, set())
        return target_state in allowed

    def transition(self, target_state: TaskState, reason: str = "") -> TaskState:
        if not self.can_transition_to(target_state):
            raise InvalidStateTransitionError(
                f"Cannot transition from {self._current_state.value} to {target_state.value}. "
                f"Allowed target states: {[s.value for s in self.LEGAL_TRANSITIONS.get(self._current_state, set())]}"
            )
        
        prev = self._current_state
        self._current_state = target_state
        self._history.append({
            "from_state": prev.value,
            "to_state": target_state.value,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "reason": reason,
        })
        return self._current_state
