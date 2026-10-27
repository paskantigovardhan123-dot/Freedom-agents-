"""LM Studio local model provider integration."""
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from backend.app.models.providers import BaseProvider
from backend.app.models.capabilities import ModelCapabilities

class LMStudioProvider(BaseProvider):
    """Integrates with locally running LM Studio inference server."""

    def __init__(self, base_url: str = "http://127.0.0.1:1234/v1", timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def is_available(self) -> bool:
        """Checks if LM Studio's OpenAI-compatible /models endpoint is reachable."""
        try:
            req = urllib.request.Request(
                f"{self.base_url}/models",
                headers={"User-Agent": "FreedomAgent"}
            )
            with urllib.request.urlopen(req, timeout=2.0) as resp:
                return resp.status == 200
        except Exception:
            return False

    def list_models(self) -> List[ModelCapabilities]:
        """Discovers locally loaded GGUF models in LM Studio."""
        try:
            req = urllib.request.Request(
                f"{self.base_url}/models",
                headers={"User-Agent": "FreedomAgent"}
            )
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = []
                for m in data.get("data", []):
                    model_id = m.get("id", "local-model")
                    models.append(ModelCapabilities(
                        model_id=model_id,
                        provider="lm_studio",
                        is_local=True,
                        context_window=m.get("context_window", 8192),
                        supports_tool_calling=True,
                        supports_structured_output=True,
                        description=f"LM Studio Local GGUF Model ({model_id})",
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
        """Generates chat completion via LM Studio /v1/chat/completions."""
        url = f"{self.base_url}/chat/completions"
        payload: Dict[str, Any] = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
            "stream": False,
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
                choice = body.get("choices", [{}])[0]
                msg = choice.get("message", {})
                return {
                    "content": msg.get("content", ""),
                    "tool_calls": msg.get("tool_calls", []),
                    "model": model_id,
                    "usage": body.get("usage", {}),
                }
        except urllib.error.URLError as e:
            raise ConnectionError(
                f"Failed to communicate with LM Studio at {self.base_url}. "
                f"Ensure LM Studio local server is started. Error: {e}"
            )
