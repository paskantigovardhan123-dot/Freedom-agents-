"""Bridges and diagnostic status detectors for external AI coding agents (OpenCode and Kilo Code)."""
import os
import shutil
import urllib.request
from typing import Dict, Any, List

class CodingAgentBridge:
    """Manages integration diagnostics, status checks, and setup instructions for external coding agents."""

    @staticmethod
    def get_opencode_status() -> Dict[str, Any]:
        """Checks if OpenCode CLI is installed or its local server is running."""
        cli_path = shutil.which("opencode")
        server_url = os.environ.get("OPENCODE_SERVER_URL", "http://127.0.0.1:4096")
        server_running = False

        try:
            req = urllib.request.Request(f"{server_url}/health", headers={"User-Agent": "FreedomAgent"})
            with urllib.request.urlopen(req, timeout=1.5) as resp:
                server_running = (resp.status == 200)
        except Exception:
            server_running = False

        status = "READY" if (server_running or cli_path) else "SETUP_REQUIRED"

        return {
            "name": "OpenCode",
            "agent_id": "opencode",
            "category": "Terminal-Native Coding Agent",
            "cli_detected": bool(cli_path),
            "cli_path": cli_path,
            "server_running": server_running,
            "server_url": server_url,
            "status": status,
            "capabilities": [
                "Non-interactive CLI execution via 'opencode run <prompt>'",
                "Headless OpenAPI server via 'opencode serve'",
                "Multi-model routing & project AGENTS.md persistence",
                "Structured JSON event outputs (--format json)",
            ],
            "setup_instructions": [
                "1. Install OpenCode CLI: curl -fsSL https://opencode.ai/install.sh | bash",
                "2. Authenticate provider: opencode auth login",
                "3. Start headless server (optional): opencode serve --port 4096",
                "4. Or execute directly inside workspace: opencode run '<task>'",
            ],
            "integration_mode": "Headless Server / Sandboxed CLI Subprocess",
        }

    @staticmethod
    def get_kilo_status() -> Dict[str, Any]:
        """Checks if Kilo Code CLI (@kilocode/cli) is installed or its gateway is reachable."""
        cli_path = shutil.which("kilo")
        gateway_url = os.environ.get("KILO_GATEWAY_URL", "https://api.kilo.ai/v1")
        has_api_key = bool(os.environ.get("KILO_API_KEY", ""))

        status = "READY" if cli_path else ("AUTHENTICATED" if has_api_key else "SETUP_REQUIRED")

        return {
            "name": "Kilo Code",
            "agent_id": "kilo",
            "category": "Multi-Agent Engineering Platform",
            "cli_detected": bool(cli_path),
            "cli_path": cli_path,
            "has_gateway_credentials": has_api_key,
            "gateway_url": gateway_url,
            "status": status,
            "capabilities": [
                "Specialized Plan, Code, and Debug agents",
                "Model-agnostic routing across 500+ LLMs via Kilo Gateway",
                "Project context persistence via AGENTS.md",
                "Model Context Protocol (MCP) tooling support",
            ],
            "setup_instructions": [
                "1. Install Kilo Code CLI: npm install -g @kilocode/cli",
                "2. Log in to Kilo: kilo login",
                "3. Set API Key in environment: export KILO_API_KEY='your-key'",
                "4. Run task from terminal: kilo run '<task>'",
            ],
            "integration_mode": "CLI Subprocess / Model-Agnostic Gateway",
        }

    @classmethod
    def get_all_agent_statuses(cls) -> List[Dict[str, Any]]:
        """Returns consolidated diagnostic statuses for all supported coding agents."""
        return [
            cls.get_opencode_status(),
            cls.get_kilo_status(),
        ]
