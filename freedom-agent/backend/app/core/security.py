"""Security utilities: Secret redaction, token generation, and path protection."""
import re
import secrets
from typing import List, Pattern

class RedactionEngine:
    """Detects and redacts secrets from logs, commands, and stdout/stderr."""
    
    REDACTION_PATTERNS: List[Pattern] = [
        # OpenAI API Keys
        re.compile(r"sk-[a-zA-Z0-9_\-]{20,}", re.IGNORECASE),
        # GitHub Personal Access Tokens
        re.compile(r"ghp_[a-zA-Z0-9]{36}", re.IGNORECASE),
        re.compile(r"github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}", re.IGNORECASE),
        # Generic Authorization Bearer tokens
        re.compile(r"Bearer\s+([a-zA-Z0-9_\-\.]{20,})", re.IGNORECASE),
        # Private Keys
        re.compile(r"-----BEGIN\s+[A-Z\s]+PRIVATE\s+KEY-----[\s\S]*?-----END\s+[A-Z\s]+PRIVATE\s+KEY-----"),
        # AWS Access Keys
        re.compile(r"AKIA[0-9A-Z]{16}"),
        # Generic password / secret assignment in env strings
        re.compile(r"(api[_-]?key|secret|password|auth_token)\s*=\s*['\"]?([^'\"\s\n]{8,})['\"]?", re.IGNORECASE),
    ]

    @classmethod
    def redact(cls, text: str) -> str:
        if not text:
            return ""
        result = text
        for pattern in cls.REDACTION_PATTERNS:
            result = pattern.sub("[REDACTED_SECRET]", result)
        return result

def generate_secure_id(prefix: str = "tsk") -> str:
    """Generate a cryptographically secure random identifier."""
    token = secrets.token_hex(8)
    return f"{prefix}_{token}"
