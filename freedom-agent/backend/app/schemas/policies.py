"""Model and Agent policy configuration schemas."""
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from backend.app.core.config import PrivacyMode, PolicyProfile

@dataclass
class ModelPolicy:
    profile_name: PolicyProfile = PolicyProfile.DEVELOPER
    privacy_mode: PrivacyMode = PrivacyMode.LOCAL_ONLY
    preferred_model: str = "qwen2.5-coder:7b"
    fallback_model: Optional[str] = "llama3.2:3b"
    temperature: float = 0.2
    max_tokens: int = 4096
    max_task_duration_seconds: int = 600
    max_retries: int = 3
    allow_network_tools: bool = False
    allow_sensitive_file_inspection: bool = False
    allow_remote_context_transfer: bool = False
    require_approval_for_commands: bool = True
    require_approval_for_file_writes: bool = False
    require_approval_for_git_commits: bool = True
    agent_tool_allowlist: Dict[str, List[str]] = field(default_factory=lambda: {
        "orchestrator": ["delegate_task", "inspect_status"],
        "architect": ["list_files", "read_file", "search_files"],
        "developer": ["read_file", "write_file", "apply_patch", "run_command"],
        "debugger": ["read_file", "search_files", "run_tests"],
        "tester": ["run_tests", "read_file", "write_file"],
        "reviewer": ["read_file", "diff_files", "git_diff"],
        "security_reviewer": ["ast_scan", "secret_scan", "policy_check"],
        "researcher": ["query_local_docs"],
    })

    @classmethod
    def get_preset(cls, profile: PolicyProfile, privacy_mode: PrivacyMode = PrivacyMode.LOCAL_ONLY) -> "ModelPolicy":
        if profile == PolicyProfile.CONSERVATIVE:
            return cls(
                profile_name=PolicyProfile.CONSERVATIVE,
                privacy_mode=privacy_mode,
                temperature=0.0,
                max_retries=1,
                allow_network_tools=False,
                require_approval_for_commands=True,
                require_approval_for_file_writes=True,
                require_approval_for_git_commits=True,
            )
        elif profile == PolicyProfile.RESEARCH:
            return cls(
                profile_name=PolicyProfile.RESEARCH,
                privacy_mode=privacy_mode,
                temperature=0.3,
                max_retries=2,
                allow_network_tools=privacy_mode != PrivacyMode.LOCAL_ONLY,
                require_approval_for_commands=True,
                require_approval_for_file_writes=True,
                require_approval_for_git_commits=True,
            )
        elif profile == PolicyProfile.LOCAL_EXPERIMENTATION:
            return cls(
                profile_name=PolicyProfile.LOCAL_EXPERIMENTATION,
                privacy_mode=PrivacyMode.LOCAL_ONLY,
                temperature=0.4,
                max_retries=5,
                allow_network_tools=False,
                require_approval_for_commands=False,
                require_approval_for_file_writes=False,
                require_approval_for_git_commits=True,
            )
        else:  # DEVELOPER
            return cls(
                profile_name=PolicyProfile.DEVELOPER,
                privacy_mode=privacy_mode,
                temperature=0.2,
                max_retries=3,
                allow_network_tools=False,
                require_approval_for_commands=True,
                require_approval_for_file_writes=False,
                require_approval_for_git_commits=True,
            )

    def to_dict(self) -> Dict:
        return {
            "profile_name": self.profile_name.value if isinstance(self.profile_name, PolicyProfile) else self.profile_name,
            "privacy_mode": self.privacy_mode.value if isinstance(self.privacy_mode, PrivacyMode) else self.privacy_mode,
            "preferred_model": self.preferred_model,
            "fallback_model": self.fallback_model,
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "max_task_duration_seconds": self.max_task_duration_seconds,
            "max_retries": self.max_retries,
            "allow_network_tools": self.allow_network_tools,
            "allow_sensitive_file_inspection": self.allow_sensitive_file_inspection,
            "allow_remote_context_transfer": self.allow_remote_context_transfer,
            "require_approval_for_commands": self.require_approval_for_commands,
            "require_approval_for_file_writes": self.require_approval_for_file_writes,
            "require_approval_for_git_commits": self.require_approval_for_git_commits,
            "agent_tool_allowlist": self.agent_tool_allowlist,
        }
