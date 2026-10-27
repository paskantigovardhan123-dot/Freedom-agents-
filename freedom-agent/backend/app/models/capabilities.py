"""Model capability descriptors."""
from dataclasses import dataclass

@dataclass
class ModelCapabilities:
    model_id: str
    provider: str
    is_local: bool = True
    context_window: int = 8192
    supports_tool_calling: bool = True
    supports_structured_output: bool = True
    supports_vision: bool = False
    description: str = ""

    def to_dict(self):
        return {
            "model_id": self.model_id,
            "provider": self.provider,
            "is_local": self.is_local,
            "context_window": self.context_window,
            "supports_tool_calling": self.supports_tool_calling,
            "supports_structured_output": self.supports_structured_output,
            "supports_vision": self.supports_vision,
            "description": self.description,
        }
