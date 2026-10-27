"""Model Registry and Privacy-Aware Universal AI Hub Routing."""
from typing import Dict, List, Optional, Any
from backend.app.core.config import PrivacyMode
from backend.app.models.capabilities import ModelCapabilities
from backend.app.models.providers import BaseProvider
from backend.app.models.ollama import OllamaProvider
from backend.app.models.lm_studio import LMStudioProvider
from backend.app.models.openai_adapter import OpenAICompatibleProvider
from backend.app.models.custom_provider import ConfigurableProvider
from backend.app.models.coding_agents import CodingAgentBridge

class ModelRegistry:
    """Manages universal model discovery, modular provider adapters, health, and privacy routing."""

    def __init__(
        self,
        privacy_mode: PrivacyMode = PrivacyMode.LOCAL_ONLY,
        ollama_url: str = "http://127.0.0.1:11434",
        lm_studio_url: str = "http://127.0.0.1:1234/v1",
        openai_base: str = "https://api.openai.com/v1",
        openai_key: str = "",
    ):
        self.privacy_mode = privacy_mode
        self.providers: Dict[str, BaseProvider] = {
            "ollama": OllamaProvider(base_url=ollama_url),
            "lm_studio": LMStudioProvider(base_url=lm_studio_url),
            "openai": OpenAICompatibleProvider(api_base=openai_base, api_key=openai_key),
        }
        self.provider_metadata: Dict[str, Dict[str, Any]] = {
            "ollama": {
                "name": "Ollama Local Daemon",
                "type": "ollama",
                "base_url": ollama_url,
                "is_local": True,
                "enabled": True,
            },
            "lm_studio": {
                "name": "LM Studio Local GGUF",
                "type": "lm_studio",
                "base_url": lm_studio_url,
                "is_local": True,
                "enabled": True,
            },
            "openai": {
                "name": "OpenAI / Compatible Cloud",
                "type": "openai",
                "base_url": openai_base,
                "is_local": False,
                "enabled": bool(openai_key),
            },
        }

    def register_provider(
        self,
        provider_id: str,
        name: str,
        api_base: str,
        api_key: str = "",
        is_local: bool = False,
        default_model: str = "default-model",
        custom_headers: Optional[Dict[str, str]] = None,
        enabled: bool = True,
    ) -> Dict[str, Any]:
        """Dynamically registers or updates a custom model provider."""
        provider = ConfigurableProvider(
            provider_id=provider_id,
            name=name,
            api_base=api_base,
            api_key=api_key,
            is_local=is_local,
            default_model=default_model,
            custom_headers=custom_headers,
        )
        self.providers[provider_id] = provider
        self.provider_metadata[provider_id] = {
            "name": name,
            "type": "configurable",
            "base_url": api_base,
            "is_local": is_local,
            "default_model": default_model,
            "has_key": bool(api_key),
            "enabled": enabled,
        }
        return self.get_provider_details(provider_id)

    def unregister_provider(self, provider_id: str) -> bool:
        """Removes a custom registered provider."""
        if provider_id in ("ollama", "lm_studio", "openai"):
            # Built-in providers can be disabled but not removed
            if provider_id in self.provider_metadata:
                self.provider_metadata[provider_id]["enabled"] = False
            return True

        if provider_id in self.providers:
            del self.providers[provider_id]
            del self.provider_metadata[provider_id]
            return True
        return False

    def get_provider_status(self) -> Dict[str, bool]:
        """Returns reachable status for all registered providers respecting PrivacyMode."""
        status: Dict[str, bool] = {}
        for pid, provider in self.providers.items():
            meta = self.provider_metadata.get(pid, {})
            is_local = meta.get("is_local", False)
            if self.privacy_mode == PrivacyMode.LOCAL_ONLY and not is_local:
                status[pid] = False
            else:
                status[pid] = provider.is_available()
        return status

    def get_provider_details(self, provider_id: str) -> Dict[str, Any]:
        """Returns metadata and discovered models for a specific provider with redacted secrets."""
        meta = self.provider_metadata.get(provider_id, {})
        provider = self.providers.get(provider_id)
        is_local = meta.get("is_local", False)
        is_active = (
            False
            if (self.privacy_mode == PrivacyMode.LOCAL_ONLY and not is_local)
            else (provider.is_available() if provider else False)
        )
        models = provider.list_models() if (provider and is_active) else []

        return {
            "provider_id": provider_id,
            "name": meta.get("name", provider_id),
            "type": meta.get("type", "generic"),
            "base_url": meta.get("base_url", ""),
            "is_local": is_local,
            "enabled": meta.get("enabled", True),
            "is_available": is_active,
            "model_count": len(models),
            "models": [m.to_dict() for m in models],
        }

    def list_all_providers(self) -> List[Dict[str, Any]]:
        """Lists all registered providers and their live diagnostic health."""
        return [self.get_provider_details(pid) for pid in self.providers.keys()]

    def list_available_models(self) -> List[ModelCapabilities]:
        """Lists all available models across active providers respecting current PrivacyMode."""
        models: List[ModelCapabilities] = []

        for pid, provider in self.providers.items():
            meta = self.provider_metadata.get(pid, {})
            if not meta.get("enabled", True):
                continue
            is_local = meta.get("is_local", False)

            # In LOCAL_ONLY mode, remote providers are completely barred
            if self.privacy_mode == PrivacyMode.LOCAL_ONLY and not is_local:
                continue

            discovered = provider.list_models()
            if discovered:
                models.extend(discovered)

        # Fallback representation if no models are active yet
        if not models:
            models.append(ModelCapabilities(
                model_id="qwen2.5-coder:7b",
                provider="ollama",
                is_local=True,
                context_window=8192,
                supports_tool_calling=True,
                supports_structured_output=True,
                description="Ollama Local Coding Model (Default)",
            ))

        return models

    def route_request(self, model_id: str, is_local_requested: bool = True) -> BaseProvider:
        """Selects provider while strictly enforcing privacy mode and fail-closed safety."""
        # Check if requested model belongs to any registered provider
        target_provider: Optional[BaseProvider] = None
        target_is_local = is_local_requested

        for pid, provider in self.providers.items():
            meta = self.provider_metadata.get(pid, {})
            # Look up model
            try:
                available = provider.list_models()
                if any(m.model_id == model_id for m in available):
                    target_provider = provider
                    target_is_local = meta.get("is_local", False)
                    break
            except Exception:
                continue

        # Fail-Closed privacy protection
        if self.privacy_mode == PrivacyMode.LOCAL_ONLY and not target_is_local:
            raise PermissionError(
                f"Routing to remote model '{model_id}' is strictly blocked in LOCAL_ONLY privacy mode. "
                "Switch to PRIVATE_HYBRID or HOSTED in Settings to permit remote inference."
            )

        if target_provider and target_provider.is_available():
            return target_provider

        # Fallback to Ollama or LM Studio for local
        if self.providers["ollama"].is_available():
            return self.providers["ollama"]
        if self.providers["lm_studio"].is_available():
            return self.providers["lm_studio"]

        if self.privacy_mode != PrivacyMode.LOCAL_ONLY and self.providers["openai"].is_available():
            return self.providers["openai"]

        # Default local provider
        return self.providers["ollama"]

    def get_coding_agents(self) -> List[Dict[str, Any]]:
        """Returns live statuses and setup steps for external coding agents (OpenCode, Kilo Code)."""
        return CodingAgentBridge.get_all_agent_statuses()
