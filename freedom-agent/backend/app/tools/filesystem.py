"""Safe workspace filesystem operations with unified diff generation."""
import os
import difflib
from typing import List, Dict, Optional
from backend.app.execution.sandbox import ExecutionSandbox
from backend.app.schemas.tools import ToolResult

class FileSystemTools:
    """Provides sandboxed file operations with automatic diff calculation."""

    def __init__(self, sandbox: ExecutionSandbox):
        self._sandbox = sandbox

    def list_files(self, sub_dir: str = "") -> List[str]:
        target = self._sandbox.validate_path(sub_dir)
        result = []
        for root, dirs, files in os.walk(target):
            # Skip hidden dirs and caches
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("__pycache__", "node_modules", "venv", ".git")]
            for file in files:
                if file.startswith("."):
                    continue
                full_path = os.path.join(root, file)
                rel_path = self._sandbox.get_relative_path(full_path)
                result.append(rel_path)
        return sorted(result)

    def read_file(self, file_path: str, max_bytes: int = 500_000) -> str:
        target = self._sandbox.validate_path(file_path)
        if not os.path.exists(target):
            raise FileNotFoundError(f"File not found: '{file_path}'")
        if os.path.isdir(target):
            raise IsADirectoryError(f"Target is a directory, not a file: '{file_path}'")
        
        with open(target, "r", encoding="utf-8", errors="replace") as f:
            return f.read(max_bytes)

    def search_files(self, query: str, sub_dir: str = "") -> List[Dict[str, str]]:
        """Search text files for matches of query string."""
        target = self._sandbox.validate_path(sub_dir)
        matches = []
        for root, dirs, files in os.walk(target):
            dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("__pycache__", "node_modules", "venv", ".git")]
            for file in files:
                full_path = os.path.join(root, file)
                try:
                    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                        for line_no, line in enumerate(f, 1):
                            if query.lower() in line.lower():
                                matches.append({
                                    "file": self._sandbox.get_relative_path(full_path),
                                    "line": line_no,
                                    "content": line.strip()[:200],
                                })
                except Exception:
                    continue
        return matches[:100]

    def write_file(self, file_path: str, new_content: str) -> str:
        """Writes content to file and returns a unified diff against previous content."""
        target = self._sandbox.validate_path(file_path)
        parent_dir = os.path.dirname(target)
        os.makedirs(parent_dir, exist_ok=True)

        old_content = ""
        if os.path.exists(target):
            with open(target, "r", encoding="utf-8", errors="replace") as f:
                old_content = f.read()

        # Generate unified diff
        old_lines = old_content.splitlines(keepends=True)
        new_lines = new_content.splitlines(keepends=True)
        diff_lines = list(difflib.unified_diff(
            old_lines,
            new_lines,
            fromfile=f"a/{file_path}",
            tofile=f"b/{file_path}",
        ))
        diff_text = "".join(diff_lines)

        with open(target, "w", encoding="utf-8") as f:
            f.write(new_content)

        return diff_text

    def apply_patch(self, file_path: str, target_block: str, replacement_block: str) -> str:
        """Replaces a targeted unique block in an existing file."""
        target = self._sandbox.validate_path(file_path)
        if not os.path.exists(target):
            raise FileNotFoundError(f"File not found: '{file_path}'")

        with open(target, "r", encoding="utf-8") as f:
            content = f.read()

        if target_block not in content:
            raise ValueError(f"Target block not found in file '{file_path}'")

        if content.count(target_block) > 1:
            raise ValueError(f"Target block matches multiple occurrences in '{file_path}'")

        new_content = content.replace(target_block, replacement_block, 1)
        return self.write_file(file_path, new_content)
