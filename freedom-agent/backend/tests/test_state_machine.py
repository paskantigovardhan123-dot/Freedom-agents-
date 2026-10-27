"""State machine validation tests."""
import unittest
from backend.app.execution.state_machine import TaskStateMachine, InvalidStateTransitionError
from backend.app.schemas.task import TaskState

class TestStateMachine(unittest.TestCase):
    def test_initial_state_is_pending(self):
        sm = TaskStateMachine()
        self.assertEqual(sm.current_state, TaskState.PENDING)

    def test_legal_flow(self):
        sm = TaskStateMachine()
        sm.transition(TaskState.PLANNING, reason="Start planning")
        self.assertEqual(sm.current_state, TaskState.PLANNING)

        sm.transition(TaskState.RUNNING, reason="Start developer agent")
        self.assertEqual(sm.current_state, TaskState.RUNNING)

        sm.transition(TaskState.VERIFYING, reason="Run tests")
        self.assertEqual(sm.current_state, TaskState.VERIFYING)

        sm.transition(TaskState.COMPLETED, reason="Verification passed")
        self.assertEqual(sm.current_state, TaskState.COMPLETED)

    def test_illegal_jump_raises_error(self):
        sm = TaskStateMachine()
        # Direct jump from PENDING to COMPLETED is forbidden
        with self.assertRaises(InvalidStateTransitionError):
            sm.transition(TaskState.COMPLETED)

    def test_cancellation_flow(self):
        sm = TaskStateMachine()
        sm.transition(TaskState.PLANNING)
        sm.transition(TaskState.WAITING_FOR_APPROVAL)
        sm.transition(TaskState.CANCELLED, reason="User rejected plan")
        self.assertEqual(sm.current_state, TaskState.CANCELLED)

if __name__ == "__main__":
    unittest.main()
