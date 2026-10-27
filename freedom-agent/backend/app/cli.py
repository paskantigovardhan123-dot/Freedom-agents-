"""Freedom Agent Command Line Interface."""
import argparse
import sys
import os

from backend.app.api.routes import service
from backend.app.schemas.task import TaskState

def main():
    parser = argparse.ArgumentParser(
        prog="freedom-agent",
        description="Freedom Agent: Privacy-First Multi-Agent Coding Framework",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # Command: run
    run_parser = subparsers.add_parser("run", help="Execute a coding task")
    run_parser.add_argument("--task", "-t", required=True, help="Natural language task description")
    run_parser.add_argument("--workspace", "-w", default=None, help="Path to project workspace")

    # Command: status
    subparsers.add_parser("status", help="Check local provider and privacy status")

    # Command: agents
    subparsers.add_parser("agents", help="List specialist agents and roles")

    args = parser.parse_args()

    if args.command == "status":
        print("\n--- Freedom Agent Runtime Status ---")
        print(f"Privacy Mode: {service.privacy_mode.value}")
        print(f"Policy Profile: {service.policy.profile_name.value}")
        providers = service.models.get_provider_status()
        print("Providers:")
        for name, active in providers.items():
            print(f"  - {name}: {'ONLINE' if active else 'OFFLINE'}")
        print("------------------------------------\n")

    elif args.command == "agents":
        print("\n--- Specialist Multi-Agent Team ---")
        agents = [
            ("Orchestrator", "Task decomposition, scheduling, verification"),
            ("Software Architect", "Minimal-change design and dependency mapping"),
            ("Developer", "Precision file patches conforming to conventions"),
            ("Debugger", "Log analysis and targeted regression repair"),
            ("Test Engineer", "Automated test suite discovery and execution"),
            ("Code Reviewer", "Independent diff audit and fragile assumption check"),
            ("Security Reviewer", "Zero-trust secrets detection and sandbox validation"),
            ("Researcher", "Local documentation and offline reference lookup"),
        ]
        for name, role in agents:
            print(f"• {name:20}: {role}")
        print("-----------------------------------\n")

    elif args.command == "run":
        print(f"\n[Freedom Agent] Initiating task: '{args.task}'")
        task = service.create_task(args.task, args.workspace)
        print(f"Task ID: {task.task_id}")
        print(f"State: {task.state.value}")
        if task.plan_steps:
            print("\nPlan Steps:")
            for step in task.plan_steps:
                print(f"  {step}")
        if task.diff:
            print("\nGenerated Unified Diff:")
            print(task.diff)
        print(f"\nOutcome: {task.state.value}\n")

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
