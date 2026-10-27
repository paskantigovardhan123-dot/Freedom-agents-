"""Tests for Universal AI Hub: Modular adapters, dynamic providers, privacy enforcement, and diagnostics."""
import unittest
from backend.app.core.config import PrivacyMode
from backend.app.models.registry import ModelRegistry
from backend.app.models.lm_studio import LMStudioProvider
from backend.app.models.custom_provider import ConfigurableProvider
from backend.app.models.coding_agents import CodingAgentBridge

class TestUniversalAIHub(unittest.TestCase):
    """Verifies Universal AI Hub adapters, registration, security boundaries, and coding agent diagnostics."""

    def setUp(self):
        self.registry = ModelRegistry(privacy_mode=PrivacyMode.LOCAL_ONLY)

    def test_initial_providers_and_locality(self):
        """Verifies default providers: Ollama, LM Studio, and OpenAI adapter."""
        providers = self.registry.list_all_providers()
        pids = [p["provider_id"] for p in providers]
        self.assertIn("ollama", pids)
        self.assertIn("lm_studio", pids)
        self.assertIn("openai", pids)

        # Check locality flags
        ollama_meta = next(p for p in providers if p["provider_id"] == "ollama")
        lm_meta = next(p for p in providers if p["provider_id"] == "lm_studio")
        openai_meta = next(p for p in providers if p["provider_id"] == "openai")

        self.assertTrue(ollama_meta["is_local"])
        self.assertTrue(lm_meta["is_local"])
        self.assertFalse(openai_meta["is_local"])

    def test_local_only_privacy_enforcement(self):
        """LOCAL_ONLY mode must strictly block remote providers and route to local models only."""
        self.registry.privacy_mode = PrivacyMode.LOCAL_ONLY
        status = self.registry.get_provider_status()

        # Remote OpenAI provider must report inactive/blocked in LOCAL_ONLY
        self.assertFalse(status["openai"])

        # Attempting to route to remote model must throw PermissionError
        with self.assertRaises(PermissionError) as ctx:
            self.registry.route_request("gpt-4o", is_local_requested=False)
        self.assertIn("strictly blocked in LOCAL_ONLY privacy mode", str(ctx.exception))

    def test_hybrid_and_hosted_routing(self):
        """Switching to PRIVATE_HYBRID or HOSTED allows remote providers when available."""
        self.registry.privacy_mode = PrivacyMode.PRIVATE_HYBRID
        # Should not raise PermissionError for is_local_requested=False
        provider = self.registry.route_request("gpt-4o", is_local_requested=False)
        self.assertIsNotNone(provider)

    def test_dynamic_custom_provider_registration(self):
        """Verifies adding, updating, and unregistering custom endpoints."""
        res = self.registry.register_provider(
            provider_id="local_vllm",
            name="Local vLLM Server",
            api_base="http://127.0.0.1:8000/v1",
            api_key="",
            is_local=True,
            default_model="mistral-7b-instruct",
            enabled=True,
        )
        self.assertEqual(res["provider_id"], "local_vllm")
        self.assertTrue(res["is_local"])
        self.assertEqual(res["type"], "configurable")

        # Verify it appears in list
        providers = self.registry.list_all_providers()
        self.assertTrue(any(p["provider_id"] == "local_vllm" for p in providers))

        # Unregister
        removed = self.registry.unregister_provider("local_vllm")
        self.assertTrue(removed)
        providers_after = self.registry.list_all_providers()
        self.assertFalse(any(p["provider_id"] == "local_vllm" for p in providers_after))

    def test_lm_studio_adapter_offline_graceful_handling(self):
        """LMStudioProvider gracefully reports False and returns empty list when daemon is not running."""
        provider = LMStudioProvider(base_url="http://127.0.0.1:54321/v1")
        self.assertFalse(provider.is_available())
        models = provider.list_models()
        self.assertEqual(models, [])

    def test_configurable_provider_missing_credentials(self):
        """Remote provider must reject generate requests when API key is missing."""
        remote_provider = ConfigurableProvider(
            provider_id="remote_cloud",
            name="Cloud AI",
            api_base="https://api.example.com/v1",
            api_key="",
            is_local=False,
        )
        with self.assertRaises(PermissionError) as ctx:
            remote_provider.generate("test-model", [{"role": "user", "content": "hello"}])
        self.assertIn("requires an API key", str(ctx.exception))

    def test_coding_agent_diagnostics_structure(self):
        """CodingAgentBridge must report verified status and instructions without fabricating success."""
        agents = CodingAgentBridge.get_all_agent_statuses()
        self.assertEqual(len(agents), 2)

        opencode = next(a for a in agents if a["agent_id"] == "opencode")
        kilo = next(a for a in agents if a["agent_id"] == "kilo")

        self.assertIn(opencode["status"], ("READY", "SETUP_REQUIRED"))
        self.assertIn(kilo["status"], ("READY", "AUTHENTICATED", "SETUP_REQUIRED"))

        # Both must include real setup steps and capabilities
        self.assertTrue(len(opencode["setup_instructions"]) > 0)
        self.assertTrue(len(kilo["setup_instructions"]) > 0)
        self.assertTrue(len(opencode["capabilities"]) > 0)
        self.assertTrue(len(kilo["capabilities"]) > 0)

if __name__ == "__main__":
    unittest.main()
