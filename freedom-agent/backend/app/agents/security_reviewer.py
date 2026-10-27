"""Security Reviewer Agent: Scans for credentials, unsafe paths, and untrusted execution risks."""
import re
from typing import Dict, Any, List
from backend.app.agents.base import BaseAgent
from backend.app.schemas.agent_message import AgentMessage
from backend.app.core.security import RedactionEngine

class SecurityReviewerAgent(BaseAgent):
    """Scans proposed code modifications and project files for security vulnerabilities."""

    RISKY_PATTERNS = [
        (re.compile(r"os\.system\(|subprocess\.Popen\(.*?shell\s*=\s*True", re.IGNORECASE), "HIGH", "Unsafe shell execution allows command injection."),
        (re.compile(r"pickle\.loads?\(", re.IGNORECASE), "HIGH", "Untrusted pickle deserialization enables arbitrary code execution."),
        (re.compile(r"yaml\.load\((?!.*?Loader\s*=\s*yaml\.SafeLoader)", re.IGNORECASE), "MEDIUM", "Unsafe YAML loading; use yaml.safe_load instead."),
        (re.compile(r"(api_key|password|secret)\s*=\s*['\"][a-zA-Z0-9_\-]{8,}['\"]", re.IGNORECASE), "CRITICAL", "Hardcoded credential detected in source code."),
    ]

    def __init__(self, tool_registry):
        super().__init__(
            agent_id="security_reviewer",
            name="Security Reviewer Agent",
            role_description="Audits diffs and dependencies for credential leaks, injection vectors, and path traversal.",
            tool_registry=tool_registry,
        )

    def handle_message(self, message: AgentMessage) -> AgentMessage:
        diff_text = message.relevant_context.get("diff", "")
        findings: List[Dict[str, str]] = []

        for pattern, severity, description in self.RISKY_PATTERNS:
            match = pattern.search(diff_text)
            if match:
                findings.append({
                    "severity": severity,
                    "description": description,
                    "evidence": RedactionEngine.redact(match.group(0)),
                    "remediation": "Remove secret from source code or use parameterized/safe APIs.",
                })

        # Check for path traversal keywords in diff
        if "../" in diff_text or "..\\" in diff_text:
            findings.append({
                "severity": "HIGH",
                "description": "Path traversal pattern ('../') detected in file modification.",
                "evidence": "../",
                "remediation": "Use os.path.realpath and workspace boundary validation.",
            })

        is_secure = len([f for f in findings if f["severity"] in ("CRITICAL", "HIGH")]) == 0

        message.result_and_evidence = {
            "secure": is_secure,
            "vulnerabilities_found": findings,
            "total_findings": len(findings),
            "threat_model_summary": "Passed zero-trust credential and path traversal checks." if is_secure else "Security issues flagged.",
        }
        message.status = "SUCCESS" if is_secure else "SECURITY_ALERT"
        return message
