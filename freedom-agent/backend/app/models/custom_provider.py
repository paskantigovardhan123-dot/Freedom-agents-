"""Configurable Cloud and OpenAI-compatible Model Provider."""
import json
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional
from backend.app.models.providers import BaseProvider
from backend.app.models.capabilities import ModelCapabilities

class ConfigurableProvider(BaseProvider):
    """Dynamic adapter for user-configured OpenAI-compatible or cloud endpoints."""

    def __init__(
        self,
        provider_id: str,
        name: str,
        api_base: str,
        api_key: str = "",
        is_local: bool = False,
        default_model: str = "default-model",
        custom_headers: Optional[Dict[str, str]] = None,
        timeout: float = 120.0,
    ):
        self.provider_id = provider_id
        self.name = name
        self.api_base = api_base.rstrip("/")
        self.api_key = api_key
        self._is_local = is_local
        self.default_model = default_model
        self.custom_headers = custom_headers or {}
        self.timeout = timeout

    def is_available(self) -> bool:
        """Verifies if the custom endpoint responds or has valid credential configuration."""
        if not self._is_local and not self.api_key:
            return False
        try:
            url = f"{self.api_base}/models"
            headers = {"User-Agent": "FreedomAgent", **self.custom_headers}
            if self.api_key:
                headers["Authorization"] = f"Bearer {self.api_key}"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=3.0) as resp:
                return resp.status == 200
        except Exception:
            # If /models is unsupported or 401/404, check if base responds
            return bool(self.api_key or self._is_local)

    def list_models(self) -> List[ModelCapabilities]:
        """Queries /models endpoint or falls back to configured default model."""
        headers = {"User-Agent": "FreedomAgent", **self.custom_headers}
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

        try:
            req = urllib.request.Request(f"{self.api_base}/models", headers=headers)
            with urllib.request.urlopen(req, timeout=5.0) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                models = []
                for m in data.get("data", []):
                    mid = m.get("id", self.default_model)
                    models.append(ModelCapabilities(
                        model_id=mid,
                        provider=self.provider_id,
                        is_local=self._is_local,
                        context_window=m.get("context_window", 32768),
                        supports_tool_calling=True,
                        supports_structured_output=True,
                        description=f"{self.name} Model ({mid})",
                    ))
                if models:
                    return models
        except Exception:
            pass

        return [
            ModelCapabilities(
                model_id=self.default_model,
                provider=self.provider_id,
                is_local=self._is_local,
                context_window=32768,
                supports_tool_calling=True,
                supports_structured_output=True,
                description=f"{self.name} Configured Endpoint ({self.default_model})",
            )
        ]

    def generate(
        self,
        model_id: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Generates completions using OpenAI-standard format."""
        if not self._is_local and not self.api_key:
            raise PermissionError(f"Provider '{self.name}' requires an API key. Please configure credentials in Settings.")

        url = f"{self.api_base}/chat/completions"
        payload: Dict[str, Any] = {
            "model": model_id or self.default_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        if tools:
            payload["tools"] = tools

        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "FreedomAgent",
            **self.custom_headers,
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"

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
            raise ConnectionError(f"Provider '{self.name}' returned HTTP {e.code}: {err_body}")
