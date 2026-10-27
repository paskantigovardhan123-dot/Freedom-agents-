"""Policy enforcement and Model Registry tests."""
import unittest

from backend.app.schemas.policies import ModelPolicy, PolicyProfile
from backend.app.core.config import PrivacyMode
from backend.app.models.registry import ModelRegistry

class TestPoliciesAndModels(unittest.TestCase):
    def test_conservative_preset(self):
        policy = ModelPolicy.get_preset(PolicyProfile.CONSERVATIVE, PrivacyMode.LOCAL_ONLY)
        self.assertEqual(policy.max_retries, 1)
        self.assertTrue(policy.require_approval_for_commands)
        self.assertTrue(policy.require_approval_for_file_writes)

    def test_local_only_fail_closed_on_remote_routing(self):
        registry = ModelRegistry(privacy_mode=PrivacyMode.LOCAL_ONLY)
        with self.assertRaises(PermissionError):
            registry.route_request("gpt-4o", is_local_requested=False)

    def test_privacy_mode_models_list(self):
        # In LOCAL_ONLY mode, only local models are exposed
        local_registry = ModelRegistry(privacy_mode=PrivacyMode.LOCAL_ONLY)
        local_models = local_registry.list_available_models()
        self.assertTrue(all(m.is_local for m in local_models))

if __name__ == "__main__":
    unittest.main()
