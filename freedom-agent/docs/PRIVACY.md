# Privacy Modes & Data Governance

Freedom Agent prioritizes local-first privacy. Unlike cloud-only developer tools, Freedom Agent allows full control over where your code and prompts are sent.

---

## The Three Privacy Modes

### 1. `LOCAL_ONLY` (Default)
- **Target**: Ollama or local LLM inference engines on `127.0.0.1` or LAN.
- **Network Egress**: Completely disabled for model calls.
- **Web Tools**: Blocked. The Research Agent operates in offline mode using project files and local documentation only.
- **Telemetry**: Zero telemetry, tracking, or phone-home requests.
- **Failure Mode**: Fail-closed. If Ollama is unreachable, tasks will halt and clearly report that the local inference node is unavailable, rather than silently routing prompts to cloud APIs.

### 2. `PRIVATE_HYBRID`
- **Target**: Local model for fast iterative code analysis; remote endpoints available for high-complexity architectural reasoning.
- **Explicit Consent**: Before transmitting any file context or prompt to an external provider, the orchestrator generates a `ConsentNotice` showing:
  - Exact target provider URL.
  - Model identifier.
  - Names of files included in the prompt context.
- The user must explicitly approve the consent notice.

### 3. `HOSTED`
- **Target**: User-configured hosted providers (e.g. OpenAI, Anthropic-compatible proxies, Azure OpenAI, OpenRouter).
- **Security Controls**:
  - API keys are injected via environment variables only; never exposed in client JavaScript.
  - Secret redaction filters ensure API keys and environment variables are never embedded in model prompts.

---

## Policy Profiles

| Profile | Allowed Tools | Approval Threshold | Max Retries |
| :--- | :--- | :--- | :--- |
| **Conservative** | Read-only file inspection, unit tests | Human approval required for all writes & commands | 1 |
| **Developer** (Default) | File create/edit, unit test runner, git status/diff | Approval required for destructive commands & git commits | 3 |
| **Research** | Read files, offline search, web search (if enabled) | Read-only; cannot write code or execute shell | 2 |
| **Local Experimentation** | All local tools, auto-apply patches | Human approval required only for fatal commands | 5 |
