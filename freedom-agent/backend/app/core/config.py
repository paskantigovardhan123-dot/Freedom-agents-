"""Configuration and Environment settings for Freedom Agent."""
import os
from enum import Enum
from dataclasses import dataclass

class PrivacyMode(str, Enum):
    LOCAL_ONLY = "LOCAL_ONLY"
    PRIVATE_HYBRID = "PRIVATE_HYBRID"
    HOSTED = "HOSTED"

class PolicyProfile(str, Enum):
    CONSERVATIVE = "Conservative"
    DEVELOPER = "Developer"
    RESEARCH = "Research"
    LOCAL_EXPERIMENTATION = "Local Experimentation"

@dataclass
class Settings:
    host: str = "127.0.0.1"
    port: int = 8000
    debug: bool = False
    privacy_mode: PrivacyMode = PrivacyMode.LOCAL_ONLY
    policy_profile: PolicyProfile = PolicyProfile.DEVELOPER
    workspace_root: str = "./workspace"
    database_url: str = "sqlite:///./freedom_agent.db"
    
    # Ollama Local Service
    ollama_base_url: str = "http://127.0.0.1:11434"
    ollama_default_model: str = "qwen2.5-coder:7b"
    ollama_timeout: float = 120.0
    
    # Remote Hosted Provider
    openai_api_base: str = "https://api.openai.com/v1"
    openai_api_key: str = ""
    openai_default_model: str = "gpt-4o"
    
    # Tool limits
    max_task_duration_seconds: int = 600
    max_command_timeout_seconds: int = 120
    max_agent_retries: int = 3
    max_parallel_tasks: int = 4
    auto_approve_read_only: bool = True
    require_approval_for_commits: bool = True
    require_approval_for_commands: bool = True

def get_settings() -> Settings:
    privacy_str = os.getenv("PRIVACY_MODE", "LOCAL_ONLY").upper()
    try:
        privacy_mode = PrivacyMode(privacy_str)
    except ValueError:
        privacy_mode = PrivacyMode.LOCAL_ONLY

    policy_str = os.getenv("POLICY_PROFILE", "Developer")
    try:
        policy_profile = PolicyProfile(policy_str)
    except ValueError:
        policy_profile = PolicyProfile.DEVELOPER

    return Settings(
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        debug=os.getenv("DEBUG", "false").lower() == "true",
        privacy_mode=privacy_mode,
        policy_profile=policy_profile,
        workspace_root=os.path.abspath(os.getenv("WORKSPACE_ROOT", "./workspace")),
        database_url=os.getenv("DATABASE_URL", "sqlite:///./freedom_agent.db"),
        ollama_base_url=os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434"),
        ollama_default_model=os.getenv("OLLAMA_DEFAULT_MODEL", "qwen2.5-coder:7b"),
        ollama_timeout=float(os.getenv("OLLAMA_TIMEOUT", "120.0")),
        openai_api_base=os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1"),
        openai_api_key=os.getenv("OPENAI_API_KEY", ""),
        openai_default_model=os.getenv("OPENAI_DEFAULT_MODEL", "gpt-4o"),
        max_task_duration_seconds=int(os.getenv("MAX_TASK_DURATION_SECONDS", "600")),
        max_command_timeout_seconds=int(os.getenv("MAX_COMMAND_TIMEOUT_SECONDS", "120")),
        max_agent_retries=int(os.getenv("MAX_AGENT_RETRIES", "3")),
        max_parallel_tasks=int(os.getenv("MAX_PARALLEL_TASKS", "4")),
        auto_approve_read_only=os.getenv("AUTO_APPROVE_READ_ONLY_TOOLS", "true").lower() == "true",
        require_approval_for_commits=os.getenv("REQUIRE_APPROVAL_FOR_COMMITS", "true").lower() == "true",
        require_approval_for_commands=os.getenv("REQUIRE_APPROVAL_FOR_COMMANDS", "true").lower() == "true",
    )
