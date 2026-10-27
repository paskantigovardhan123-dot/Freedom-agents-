"""Workspace boundary validation and execution sandboxing."""
import os
import re
from typing import List

class PathTraversalError(Exception):
    """Raised when a path escapes the configured workspace boundary."""
    pass

class SensitiveAccessError(Exception):
    """Raised when an operation attempts to access credentials or sensitive system files."""
    pass

class ExecutionSandbox:
    """Enforces strict filesystem and execution isolation within a workspace."""

    # Blocked sensitive patterns by default
    SENSITIVE_PATTERNS: List[re.Pattern] = [
        re.compile(r"^\.env(\..+)?$", re.IGNORECASE),
        re.compile(r"id_rsa|id_ed25519|id_ecdsa", re.IGNORECASE),
        re.compile(r"\.git/config", re.IGNORECASE),
        re.compile(r"credentials\.json", re.IGNORECASE),
        re.compile(r"\.npmrc|\.pypirc", re.IGNORECASE),
        re.compile(r"\.aws/credentials", re.IGNORECASE),
    ]

    def __init__(self, workspace_root: str, allow_sensitive: bool = False):
        self._workspace_root = os.path.realpath(os.path.abspath(workspace_root))
        self._allow_sensitive = allow_sensitive
        
        # Ensure workspace exists
        os.makedirs(self._workspace_root, exist_ok=True)

    @property
    def workspace_root(self) -> str:
        return self._workspace_root

    def validate_path(self, target_path: str = "") -> str:
        """Resolve and validate a target path to ensure it remains strictly inside workspace_root."""
        if target_path is None or not target_path.strip() or target_path.strip() == ".":
            return self._workspace_root

        # Resolve path relative to workspace_root
        if os.path.isabs(target_path):
            resolved = os.path.realpath(target_path)
        else:
            resolved = os.path.realpath(os.path.join(self._workspace_root, target_path))

        # Check path containment
        common = os.path.commonpath([self._workspace_root, resolved])
        if common != self._workspace_root:
            raise PathTraversalError(
                f"Path traversal detected: '{target_path}' escapes workspace root '{self._workspace_root}'"
            )

        # Check for sensitive file access
        if not self._allow_sensitive:
            rel_path = os.path.relpath(resolved, self._workspace_root).replace("\\", "/")
            base_name = os.path.basename(resolved)
            for pattern in self.SENSITIVE_PATTERNS:
                if pattern.search(rel_path) or pattern.search(base_name):
                    raise SensitiveAccessError(
                        f"Access to sensitive file '{rel_path}' is blocked by sandbox policy"
                    )

        return resolved

    def get_relative_path(self, absolute_path: str) -> str:
        """Return relative path to workspace root."""
        return os.path.relpath(absolute_path, self._workspace_root).replace("\\", "/")
