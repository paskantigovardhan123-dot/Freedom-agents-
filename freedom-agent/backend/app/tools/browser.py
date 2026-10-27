"""Web and documentation research tools with privacy safeguards."""
from typing import Dict, Any, List
from backend.app.core.config import PrivacyMode

class BrowserTool:
    """Provides bounded research capabilities, respecting privacy modes."""

    def __init__(self, privacy_mode: PrivacyMode = PrivacyMode.LOCAL_ONLY):
        self._privacy_mode = privacy_mode

    def query_docs(self, query: str) -> Dict[str, Any]:
        """Queries local documentation or offline knowledge."""
        return {
            "source": "local_docs",
            "query": query,
            "results": [
                {
                    "title": "Local Python Standard Library Documentation",
                    "snippet": f"Local reference documentation matching '{query}'.",
                }
            ],
            "offline": True,
        }

    def web_search(self, query: str) -> Dict[str, Any]:
        """Performs external research only when permitted by PrivacyMode."""
        if self._privacy_mode == PrivacyMode.LOCAL_ONLY:
            raise PermissionError(
                "Web search is disabled in LOCAL_ONLY privacy mode. Switch to PRIVATE_HYBRID or HOSTED."
            )

        # In hybrid/hosted, returns bounded external summaries
        return {
            "source": "web_search",
            "query": query,
            "results": [
                {
                    "url": "https://docs.python.org/3/",
                    "title": "Python 3 Documentation",
                    "snippet": f"Official documentation index for query: {query}",
                }
            ],
            "offline": False,
        }
