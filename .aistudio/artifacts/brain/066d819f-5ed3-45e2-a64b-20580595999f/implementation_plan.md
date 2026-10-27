# FREEDOM AGENT — Universal AI Integration Hub

Architecture audit of the existing codebase and detailed implementation blueprint for a modular Universal AI Hub. Extends the multi-agent runtime with pluggable inference adapters (Ollama, LM Studio, OpenAI-compatible APIs, configurable cloud providers, OpenCode, and Kilo Code) while strictly preserving zero-trust privacy boundaries, local approvals, and existing Android companion compatibility.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Zero Modification Rule**: No existing backend APIs, 17 backend tests, Android application code, or privacy boundaries will be broken or removed. All new provider features are additive and isolated behind modular adapters.

- **Adapter Abstraction (`BaseProvider`)**: All inference engines inherit from an extensible `BaseProvider` protocol with typed model capabilities (`context_window`, `is_local`, `supports_tool_calling`, `supports_structured_output`).
- **External Coding Agents (OpenCode & Kilo Code)**: Real-world audit confirms OpenCode provides `opencode run` and `opencode serve` (HTTP server at `http://127.0.0.1:4096`), while Kilo Code operates via `@kilocode/cli` (`kilo run`/`kilo serve` or Kilo Gateway). Following strict anti-mocking rules, Freedom Agent will detect if their local daemon/CLI is installed and running; if absent, it displays verified installation and launch guides rather than fabricating fake executions.
- **Secret Isolation**: Provider API keys are configured and encrypted in the local backend secret store (`.env` / backend memory) and **never** returned to client-side browsers, Android payloads, or exported JSON audit logs.
- **Fail-Closed Privacy (`LOCAL_ONLY`)**: When `PrivacyMode.LOCAL_ONLY` is active, network calls to remote endpoints (e.g. OpenAI, Anthropic, remote OpenRouter) fail closed with `403 Forbidden` and cannot silently leak prompts or diffs.

---

## 1. Architecture Audit (Phase 1)

### Existing Backend Infrastructure (`freedom-agent/backend`)
1. **Model Management (`backend/app/models/`)**:
   - `capabilities.py`: `ModelCapabilities` dataclass tracking `model_id`, `provider`, `is_local`, `context_window`, `supports_tool_calling`, `supports_structured_output`.
   - `providers.py`: Abstract `BaseProvider` declaring `is_available()`, `list_models()`, `generate(model_id, messages, temperature, max_tokens, tools)`.
   - `ollama.py`: `OllamaProvider` connecting via `urllib.request` to `http://127.0.0.1:11434` (`/api/tags` and `/api/chat`).
   - `openai_adapter.py`: `OpenAICompatibleProvider` for Bearer-authenticated OpenAI `/chat/completions`.
   - `registry.py`: `ModelRegistry` implementing privacy-aware routing based on `PrivacyMode`.
2. **Core Security & Sandbox (`backend/app/core/` & `backend/app/execution/`)**:
   - `core/config.py`: Enums `PrivacyMode` (`LOCAL_ONLY`, `PRIVATE_HYBRID`, `HOSTED`), `PolicyProfile`, environment paths.
   - `core/security.py`: `RedactionEngine` masking API tokens (`sk-...`, Bearer, passwords) and generating secure IDs.
   - `execution/sandbox.py`: `ExecutionSandbox` canonicalizing workspace paths, blocking directory escapes (`PathTraversalError`), and forbidding access to `.env`, `.git`, `.ssh`.
   - `execution/approvals.py`: `ApprovalManager` gating high-risk file modifications and terminal commands behind human sign-off.
   - `execution/state_machine.py`: `TaskStateMachine` managing valid lifecycle transitions (`PENDING -> PLANNING -> WAITING_FOR_APPROVAL -> RUNNING -> VERIFYING -> COMPLETED`).
3. **Multi-Agent Runtime (`backend/app/agents/`)**:
   - `orchestrator.py`: Coordinates 8 specialist agents (`architect`, `developer`, `debugger`, `tester`, `reviewer`, `security_reviewer`, `researcher`).
4. **API Routes & Web Server (`backend/app/api/routes.py` & `main.py`)**:
   - Dual-engine: FastAPI with zero-dependency fallback `ThreadingHTTPServer`.
   - Existing endpoints: `/api/health`, `/api/providers`, `/api/models`, `/api/agents`, `/api/tasks`, `/api/workspace/files`, `/api/workspace/file`, `/api/settings/privacy`, `/api/settings/policies`.
5. **Existing Backend Tests (`backend/tests/`)**:
   - 17 verified passing unit tests (`test_sandbox_security.py`, `test_state_machine.py`, `test_tools_and_redaction.py`, `test_policies_and_models.py`, `test_orchestrator_integration.py`).

### Existing Frontend Architecture (`freedom-agent/frontend`)
- **Framework**: React 18 + Vite + TypeScript in futuristic glassmorphism theme (`#070913` midnight navy, cyan/indigo/violet accents).
- **Navigation (`Navbar.tsx` & `App.tsx`)**: 7 screens: Dashboard, Agent Center, Task Center, Agent Builder, Activity & Logs, Files & Knowledge, Settings.
- **Client (`src/api/client.ts`)**: REST client querying local backend on `/api`.

### Existing Android App (`app/`)
- Jetpack Compose Edge-to-Edge application with 33 up-to-date Gradle tasks and passing Robolectric tests (`FreedomAgentApp.kt`, `FreedomAgentViewModel.kt`).

---

## 2. Universal AI Hub Concept & UX

The new **Model & Universal AI Hub** will be integrated as an enhanced primary view accessible via the Navbar and Settings, featuring dedicated modular cards:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      UNIVERSAL AI INTEGRATION HUB                          │
├─────────────────┬──────────────────┬──────────────────┬─────────────────────┤
│  Ollama Local   │    LM Studio     │ OpenAI-Compatible│  Coding Agents      │
│  [127.0.0.1]    │   [127.0.0.1]    │ Custom Base URL  │ OpenCode / Kilo     │
│  ● ONLINE       │   ○ STANDBY      │ ● CONFIGURED     │ ℹ CLI DETECTED      │
└─────────────────┴──────────────────┴──────────────────┴─────────────────────┘
```

### Visual & Interactive Features
- **Provider Cards with Glassmorphism**: Translucent panels with gradient border glow showing connection health, detected latency, locality tag (`LOCAL` vs `REMOTE`), model counts, and active capabilities.
- **Provider Configuration Modal**:
  - Add / edit / toggle custom endpoints (e.g. Local LM Studio at `http://127.0.0.1:1234/v1`, vLLM, Ollama, OpenRouter, Together, Anthropic/OpenAI proxies).
  - Test Connection button with immediate round-trip validation and model enumeration.
  - Secret input field with masked display (`••••••••`) and zero-exposure storage.
- **External Coding Agent Panels (OpenCode & Kilo Code)**:
  - Real-time diagnostic check for local background server (`opencode serve` / `kilo serve`) or CLI binaries.
  - Transparent status badge: `Detected & Ready` vs `Setup Required`.
  - Step-by-step setup guide with copyable terminal commands when unconfigured.

---

## 3. Modular Adapters & Provider Management (Phase 2 & 3)

### New & Enhanced Backend Modules (`backend/app/models/`)

1. **`lm_studio.py` (`LMStudioProvider`)**:
   - Subclasses `BaseProvider`.
   - Communicates with standard LM Studio local server (`http://127.0.0.1:1234/v1`).
   - Discovers locally loaded GGUF models via `/v1/models`.
   - Generates completions with tool support matching OpenAI-compatible format.
   - Marked as `is_local = True` so it operates seamlessly under `PrivacyMode.LOCAL_ONLY`.

2. **`custom_provider.py` (`ConfigurableProvider`)**:
   - Dynamic adapter for user-defined cloud or on-prem endpoints (e.g. OpenRouter, DeepSeek, Mistral, Groq, self-hosted vLLM).
   - Allows custom base URLs, custom headers, and securely stored API credentials.

3. **`coding_agents.py` (`CodingAgentBridge`)**:
   - **OpenCode Adapter**: Tests if `opencode` binary exists in system `PATH` or if `http://127.0.0.1:4096` responds to health checks. Formats commands via `opencode run "<prompt>" --format json` or HTTP client.
   - **Kilo Code Adapter**: Tests for `@kilocode/cli` or Kilo local bridge. Reports exact installation command (`npm install -g @kilocode/cli`) and status.

4. **Dynamic Provider Management in `ModelRegistry`**:
   - Allows runtime registration, editing, enabling, and disabling of providers.
   - Persists provider configurations in `freedom_agent.db` or config file with secret redaction.
   - Exposes new REST endpoints:
     - `GET /api/hub/providers` — lists all providers with status, model lists, and locality.
     - `POST /api/hub/providers` — adds or updates a provider (URL, name, type, enabled).
     - `POST /api/hub/providers/test` — tests reachability and fetches models dynamically.
     - `DELETE /api/hub/providers/{id}` — removes custom provider.
     - `GET /api/hub/coding-agents` — checks OpenCode and Kilo Code status.

---

## 4. Security, Privacy & Secret Protection (Phase 4)

1. **Privacy Mode Enforcement**:
   - `LOCAL_ONLY`: Routing checks `is_local == True`. If a remote provider is invoked, throws `PermissionError(403)` immediately before network egress.
   - `PRIVATE_HYBRID`: Prioritizes local Ollama/LM Studio; allows whitelisted remote endpoints if explicitly enabled.
   - `HOSTED_DIRECT`: Allows verified remote endpoints.
2. **Secret Redaction**:
   - All API keys stored server-side only. Responses returned to client mask keys (`sk-...****`).
   - `RedactionEngine` in `backend/app/core/security.py` updated with patterns for LM Studio, OpenCode tokens, and generic bearer keys.
3. **Approval Gates & Sandboxing**:
   - No coding agent or model can escape the canonical `workspace_root`.
   - Risky shell commands or destructive diffs continue to trigger `ApprovalManager` before execution.

---

## 5. Technical Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                   FREEDOM AGENT FRONTEND (React)                       │
│  ┌───────────────┐ ┌────────────────┐ ┌─────────────────────────────┐  │
│  │ Dashboard     │ │ Universal Hub  │ │ Task & Agent Centers        │  │
│  │ & Cipher Bot  │ │ Model/Adapters │ │ Workspaces, Diff & Logs     │  │
│  └───────┬───────┘ └───────┬────────┘ └──────────────┬──────────────┘  │
└──────────┼─────────────────┼─────────────────────────┼─────────────────┘
           │                 ▼                         │
           │        /api/hub/providers                 │
           │        /api/hub/coding-agents             │
           ▼                 ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    FREEDOM AGENT BACKEND SERVICE                       │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                       ModelRegistry                              │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │ Privacy Router (LOCAL_ONLY / HYBRID / HOSTED Enforcement) │  │  │
│  │  └────────────────────────────┬───────────────────────────────┘  │  │
│  └───────────────────────────────┼──────────────────────────────────┘  │
│                                  │                                     │
│       ┌──────────────┬───────────┴───┬──────────────┬──────────────┐   │
│       ▼              ▼               ▼              ▼              ▼   │
│ ┌───────────┐  ┌───────────┐  ┌─────────────┐ ┌──────────┐ ┌─────────┐ │
│ │  Ollama   │  │ LM Studio │  │ OpenAI /    │ │ OpenCode │ │  Kilo   │ │
│ │ Provider  │  │ Provider  │  │ Cloud Proxy │ │  Bridge  │ │  Bridge │ │
│ └─────┬─────┘  └─────┬─────┘  └──────┬──────┘ └────┬─────┘ └────┬────┘ │
└───────┼──────────────┼───────────────┼─────────────┼────────────┼──────┘
        ▼              ▼               ▼             ▼            ▼
   127.0.0.1:      127.0.0.1:      Remote API    opencode CLI  kilo CLI
     11434           1234          Endpoints      / Local Svr   / Gateway
  (Local Air-Gap) (Local Air-Gap) (Hybrid Only) (Subprocess)   (Subprocess)
```

---

## 6. Implementation & Verification Steps (Phase 5)

1. **Backend Modular Adapters**:
   - Implement `backend/app/models/lm_studio.py` for LM Studio compatibility.
   - Implement `backend/app/models/coding_agents.py` for OpenCode & Kilo Code detection/bridging.
   - Extend `backend/app/models/registry.py` with dynamic provider registry and status checks.
   - Add REST handlers in `backend/app/api/routes.py` and `backend/app/main.py`.
2. **Backend Unit & Security Tests**:
   - Add `backend/tests/test_universal_hub.py`:
     - Test LM Studio adapter mock responses and error states.
     - Test provider registration, enable/disable toggles.
     - Test LOCAL_ONLY strict blocking against remote providers.
     - Test secret redaction on provider configurations.
     - Test OpenCode / Kilo Code status reporting when CLI/daemon is absent.
   - Ensure all 17 existing tests continue to pass.
3. **Frontend Universal AI Hub UI**:
   - Add `freedom-agent/frontend/src/pages/UniversalHub.tsx` matching glassmorphism style.
   - Add Hub navigation tab in `Navbar.tsx` and route in `App.tsx`.
   - Update `client.ts` with typed hub API methods.
   - Run `npm --prefix freedom-agent/frontend run build` to verify 0 TypeScript/Vite errors.
4. **Android Compatibility**:
   - Run `gradle :app:testDebugUnitTest` and `compile_applet` to confirm zero regression.
