"""Tool definitions and invocation schemas."""
from typing import Dict, Any, Optional
from dataclasses import dataclass, field

@dataclass
class ToolDefinition:
    name: str
    description: str
    parameters: Dict[str, Any]
    requires_approval: bool = False
    is_read_only: bool = True

    def to_dict(self) -> Dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
            "requires_approval": self.requires_approval,
            "is_read_only": self.is_read_only,
        }

@dataclass
class ToolResult:
    tool_name: str
    success: bool
    output: str
    error: Optional[str] = None
    duration_ms: float = 0.0
    exit_code: int = 0
    diff: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "tool_name": self.tool_name,
            "success": self.success,
            "output": self.output,
            "error": self.error,
            "duration_ms": self.duration_ms,
            "exit_code": self.exit_code,
            "diff": self.diff,
        }
