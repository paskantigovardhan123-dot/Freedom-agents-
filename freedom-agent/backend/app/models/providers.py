"""Abstract Base Provider for Model integrations."""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from backend.app.models.capabilities import ModelCapabilities

class BaseProvider(ABC):
    """Abstract interface for LLM backends."""

    @abstractmethod
    def is_available(self) -> bool:
        """Checks if backend endpoint is reachable."""
        pass

    @abstractmethod
    def list_models(self) -> List[ModelCapabilities]:
        """Lists available models from backend."""
        pass

    @abstractmethod
    def generate(
        self,
        model_id: str,
        messages: List[Dict[str, str]],
        temperature: float = 0.2,
        max_tokens: int = 4096,
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """Generates completion or structured tool call."""
        pass
