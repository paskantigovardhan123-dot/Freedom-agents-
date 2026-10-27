"""OpenAI-compatible Hosted Provider Adapter."""
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from backend.app.models.providers import BaseProvider
from backend.app.models.capabilities import ModelCapabilities

class OpenAICompatibleProvider(BaseProvider):
    """Adapter for hosted OpenAI-compatible APIs."""

    def __init__(self, api_base: str = "https://api.openai.com/v1", api_key: str = "", timeout: float = 120.0):
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key
        self.timeout = timeout

    def is_available(self) -> bool:
        return bool(self.api_key)

    def list_models(self) -> List[ModelCapabilities]:
        if not self.api_key:
            return []
        return [
            ModelCapabilities(
                model_id="gpt-4o",
                provider="openai-compatible",
                is_local=False,
                context_window=128000,
                supports_tool_calling=True,
                supports_structured_output=True,
                description="Hosted OpenAI GPT-4o",
            ),
            ModelCapabilities(
                model_id="gpt-4o-mini",
                provider="openai-compatible",
                is_local=False,
                context_window=128000,
                supports_tool_calling=True,
                supports_structured_output=True,
                description="Hosted OpenAI GPT-4o Mini",
            ),
        ]

    def generate(
        self,
        model_id: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        if not self.api_key:
            raise PermissionError("Hosted provider API key is not configured. Set OPENAI_API_KEY in .env.")

        url = f"{self.api_base}/chat/completions"
        payload: Dict[str, Any] = {
            "model": model_id,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            payload["tools"] = tools

        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}",
            "User-Agent": "FreedomAgent",
        }
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method="POST")

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
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8", errors="ignore")
            raise ConnectionError(f"Hosted provider returned HTTP {e.code}: {err_body}")
