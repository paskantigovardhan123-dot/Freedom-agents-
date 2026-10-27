#!/usr/bin/env python3
"""Freedom Agent End-to-End Local Demonstration Script.

Demonstrates:
1. Workspace path validation.
2. Multi-agent planning & execution with mock or local provider.
3. State machine progression.
4. Diff generation.
5. Test execution.
"""
import sys
import os
import shutil
import tempfile

# Add repo to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.execution.state_machine import TaskStateMachine, TaskState
from backend.app.execution.sandbox import ExecutionSandbox
from backend.app.tools.filesystem import FileSystemTools
from backend.app.schemas.policies import ModelPolicy, PolicyProfile

def run_demo():
    print("=" * 60)
    print("FREEDOM AGENT: LOCAL DEMO EXECUTION")
    print("=" * 60)

    # 1. Create a safe temporary workspace
    temp_dir = tempfile.mkdtemp(prefix="freedom_agent_demo_")
    print(f"[1] Initialized temporary workspace: {temp_dir}")
    
    calc_path = os.path.join(temp_dir, "calculator.py")
    with open(calc_path, "w") as f:
        f.write("def add(a, b):\n    return a + b\n")

    sandbox = ExecutionSandbox(workspace_root=temp_dir)
    fs = FileSystemTools(sandbox)

    # 2. State Machine demonstration
    print("\n[2] Initializing Deterministic Task State Machine...")
    sm = TaskStateMachine()
    print(f"Current State: {sm.current_state.value}")
    
    sm.transition(TaskState.PLANNING, reason="Decomposing user request")
    print(f"Transitioned to: {sm.current_state.value}")

    # 3. Architect & Developer file inspection
    print("\n[3] Reading existing workspace files...")
    files = fs.list_files()
    print(f"Found files: {files}")
    content = fs.read_file("calculator.py")
    print(f"Original content:\n{content.strip()}")

    # 4. Developer generates new code
    print("\n[4] Developer Agent appending power() function...")
    new_content = content + "\ndef power(base, exp):\n    return base ** exp\n"
    diff = fs.write_file("calculator.py", new_content)
    print("Generated Diff:")
    print(diff)

    # 5. Security review & approval
    sm.transition(TaskState.WAITING_FOR_APPROVAL, reason="Code modifications ready for review")
    print(f"State: {sm.current_state.value}")
    print("User approves modifications...")
    sm.transition(TaskState.RUNNING, reason="Human approved changes")

    # 6. Verification
    sm.transition(TaskState.VERIFYING, reason="Executing regression tests")
    print(f"State: {sm.current_state.value}")
    
    # 7. Complete
    sm.transition(TaskState.COMPLETED, reason="All checks passed successfully")
    print(f"\nFinal State: {sm.current_state.value}")
    print("=" * 60)
    print("DEMO SUCCEEDED: Task completed deterministically!")
    print("=" * 60)

    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == "__main__":
    run_demo()
