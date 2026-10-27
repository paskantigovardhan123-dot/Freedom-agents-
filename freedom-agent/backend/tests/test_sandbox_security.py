"""Security and Sandbox verification tests."""
import unittest
import tempfile
import os
import shutil

from backend.app.execution.sandbox import (
    ExecutionSandbox,
    PathTraversalError,
    SensitiveAccessError,
)
from backend.app.core.security import RedactionEngine

class TestSandboxSecurity(unittest.TestCase):
    def setUp(self):
        self.temp_ws = tempfile.mkdtemp(prefix="fa_test_sec_")
        self.sandbox = ExecutionSandbox(workspace_root=self.temp_ws)

    def tearDown(self):
        shutil.rmtree(self.temp_ws, ignore_errors=True)

    def test_valid_path_resolution(self):
        valid = self.sandbox.validate_path("src/main.py")
        expected = os.path.realpath(os.path.join(self.temp_ws, "src/main.py"))
        self.assertEqual(valid, expected)

    def test_path_traversal_double_dot_rejected(self):
        with self.assertRaises(PathTraversalError):
            self.sandbox.validate_path("../../etc/passwd")

    def test_absolute_path_escape_rejected(self):
        outside_path = "/tmp" if os.name != "nt" else "C:\\Windows"
        with self.assertRaises(PathTraversalError):
            self.sandbox.validate_path(outside_path)

    def test_sensitive_file_access_blocked(self):
        with self.assertRaises(SensitiveAccessError):
            self.sandbox.validate_path(".env")

        with self.assertRaises(SensitiveAccessError):
            self.sandbox.validate_path("id_rsa")

        with self.assertRaises(SensitiveAccessError):
            self.sandbox.validate_path("credentials.json")

    def test_secret_redaction_engine(self):
        sample_log = (
            "Connecting to API with key sk-abcdef1234567890abcdef1234567890\n"
            "Using token ghp_123456789012345678901234567890123456\n"
            "Authorization: Bearer mySecretToken1234567890abc"
        )
        redacted = RedactionEngine.redact(sample_log)
        self.assertNotIn("sk-abcdef", redacted)
        self.assertNotIn("ghp_12345", redacted)
        self.assertNotIn("mySecretToken", redacted)
        self.assertIn("[REDACTED_SECRET]", redacted)

if __name__ == "__main__":
    unittest.main()
