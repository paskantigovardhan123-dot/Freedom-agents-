"""Base Agent definition."""
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from backend.app.schemas.agent_message import AgentMessage
from backend.app.tools.registry import ToolRegistry

class BaseAgent(ABC):
    """Abstract base class for all specialist agents."""

    def __init__(self, agent_id: str, name: str, role_description: str, tool_registry: ToolRegistry):
        self.agent_id = agent_id
        self.name = name
        self.role_description = role_description
        self.tools = tool_registry

    @abstractmethod
    def handle_message(self, message: AgentMessage) -> AgentMessage:
        """Processes an incoming typed task message and returns updated message with evidence."""
        pass
