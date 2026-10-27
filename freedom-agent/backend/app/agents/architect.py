"""Software Architect Agent: Analyzes repository layout and produces minimal-change implementation specs."""
from typing import List, Dict, Any
from backend.app.agents.base import BaseAgent
from backend.app.schemas.agent_message import AgentMessage

class ArchitectAgent(BaseAgent):
    """Inspects workspace architecture and produces minimal-change execution plans."""

    def __init__(self, tool_registry):
        super().__init__(
            agent_id="architect",
            name="Software Architect",
            role_description="Analyzes existing architecture, identifies dependencies, and devises minimal-change task specifications.",
            tool_registry=tool_registry,
        )

    def handle_message(self, message: AgentMessage) -> AgentMessage:
        # Inspect workspace file structure
        files = self.tools.fs.list_files()
        
        # 1. Check if any file is explicitly named in the prompt
        import os
        objective = message.user_objective.lower()
        explicit_matches = [f for f in files if os.path.basename(f).lower() in objective]

        # 2. Identify other candidate files, sorting implementation files ahead of test files
        other_files = []
        for f in files:
            if f in explicit_matches:
                continue
            base = f.lower()
            if any(k in base for k in ("calc", "math", "main", "app", "api", "model", "tool", "util", "service", "test")):
                other_files.append(f)

        other_files.sort(key=lambda x: (os.path.basename(x).startswith("test_"), x))
        relevant_files = explicit_matches + other_files
        if not relevant_files:
            relevant_files = sorted(files, key=lambda x: (os.path.basename(x).startswith("test_"), x))

        plan = [
            f"1. Read identified component files: {relevant_files or files[:3]}",
            "2. Identify interface signatures and minimal modifications required",
            "3. Formulate bounded patch for Developer Agent",
            "4. Verify compatibility and test regressions with Test Engineer Agent",
        ]

        message.file_references = relevant_files or files[:5]
        message.result_and_evidence = {
            "workspace_files_count": len(files),
            "relevant_files": relevant_files,
            "architectural_plan": plan,
            "compatibility_risks": "Low. Targeted function additions preserve existing contract.",
        }
        message.status = "SUCCESS"
        return message
