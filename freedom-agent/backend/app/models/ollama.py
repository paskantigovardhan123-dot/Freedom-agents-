"""Ollama local model provider integration."""
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from backend.app.models.providers import BaseProvider
from backend.app.models.capabilities import ModelCapabilities

class OllamaProvider(BaseProvider):
    """Integrates with locally running Ollama instance."""

    def __init__(self, base_url: str = "http://127.0.0.1:11434", timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def is_available(self) -> bool:
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", headers={"User-Agent": "FreedomAgent"})
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                return resp.status == 200
        except Exception:
            return False

    def list_models(self) -> List[ModelCapabilities]:
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", headers={"User-Agent": "FreedomAgent"})
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = []
                for m in data.get("models", []):
                    name = m.get("name", "")
                    models.append(ModelCapabilities(
                        model_id=name,
                        provider="ollama",
                        is_local=True,
                        context_window=8192,
                        supports_tool_calling=True,
                        supports_structured_output=True,
                        description=f"Ollama local model ({name})",
                    ))
                return models
        except Exception:
            return []

    def generate(
        self,
        model_id: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Calls Ollama /api/chat endpoint."""
        url = f"{self.base_url}/api/chat"
        payload = {
            "model": model_id,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
            }
        }
        if tools:
            payload["tools"] = tools

        data_bytes = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data_bytes,
            headers={"Content-Type": "application/json", "User-Agent": "FreedomAgent"},
            method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                msg = body.get("message", {})
                return {
                    "content": msg.get("content", ""),
                    "tool_calls": msg.get("tool_calls", []),
                    "model": model_id,
                    "prompt_eval_count": body.get("prompt_eval_count", 0),
                    "eval_count": body.get("eval_count", 0),
                }
        except urllib.error.URLError as e:
            raise ConnectionError(
                f"Failed to communicate with local Ollama at {self.base_url}. "
                f"Ensure 'ollama serve' is running and model '{model_id}' is pulled. Error: {e}"
            )
