"""Project-scoped SQLite context manager and history retention."""
import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from backend.app.core.security import RedactionEngine

class ContextManager:
    """Manages workspace-isolated task summaries and persistent execution history."""

    def __init__(self, db_path: str = "freedom_agent.db", enabled: bool = True):
        self._db_path = db_path
        self._enabled = enabled
        self._init_db()

    def _init_db(self):
        if not self._enabled:
            return
        os.makedirs(os.path.dirname(os.path.abspath(self._db_path)), exist_ok=True)
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS project_contexts (
                    workspace_id TEXT PRIMARY KEY,
                    instructions TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS task_reports (
                    task_id TEXT PRIMARY KEY,
                    workspace_id TEXT,
                    title TEXT,
                    prompt TEXT,
                    plan_steps TEXT,
                    diff TEXT,
                    test_summary TEXT,
                    final_state TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            conn.commit()

    def save_task_report(
        self,
        task_id: str,
        workspace_id: str,
        title: str,
        prompt: str,
        plan_steps: List[str],
        diff: str,
        test_summary: str,
        final_state: str,
    ):
        if not self._enabled:
            return
        redacted_diff = RedactionEngine.redact(diff)
        redacted_test = RedactionEngine.redact(test_summary)
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT OR REPLACE INTO task_reports 
                (task_id, workspace_id, title, prompt, plan_steps, diff, test_summary, final_state)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                task_id,
                workspace_id,
                title,
                prompt,
                json.dumps(plan_steps),
                redacted_diff,
                redacted_test,
                final_state,
            ))
            conn.commit()

    def get_task_report(self, task_id: str) -> Optional[Dict[str, Any]]:
        if not self._enabled:
            return None
        with sqlite3.connect(self._db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM task_reports WHERE task_id = ?", (task_id,))
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "task_id": row["task_id"],
                "workspace_id": row["workspace_id"],
                "title": row["title"],
                "prompt": row["prompt"],
                "plan_steps": json.loads(row["plan_steps"] or "[]"),
                "diff": row["diff"],
                "test_summary": row["test_summary"],
                "final_state": row["final_state"],
                "created_at": row["created_at"],
            }

    def list_reports(self, workspace_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if not self._enabled:
            return []
        with sqlite3.connect(self._db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if workspace_id:
                cursor.execute("SELECT * FROM task_reports WHERE workspace_id = ? ORDER BY created_at DESC", (workspace_id,))
            else:
                cursor.execute("SELECT * FROM task_reports ORDER BY created_at DESC")
            rows = cursor.fetchall()
            return [{
                "task_id": r["task_id"],
                "workspace_id": r["workspace_id"],
                "title": r["title"],
                "prompt": r["prompt"],
                "plan_steps": json.loads(r["plan_steps"] or "[]"),
                "diff": r["diff"],
                "test_summary": r["test_summary"],
                "final_state": r["final_state"],
                "created_at": r["created_at"],
            } for r in rows]

    def clear_history(self, workspace_id: str):
        """Clears stored agent memory and reports for a given workspace."""
        if not self._enabled:
            return
        with sqlite3.connect(self._db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM task_reports WHERE workspace_id = ?", (workspace_id,))
            cursor.execute("DELETE FROM project_contexts WHERE workspace_id = ?", (workspace_id,))
            conn.commit()
