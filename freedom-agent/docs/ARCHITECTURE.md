# Freedom Agent: System Architecture Specification

## 1. Architectural Philosophy

Freedom Agent implements a **deterministic execution runtime** around probabilistic language models. 
The system does not rely on language models to self-police permissions, manage task transitions, or guard sandbox boundaries.

### Core Principles

1. **Role Specialization**: Agents have narrow, distinct domains with strictly bounded prompt context and tool access.
2. **Deterministic State Machine**: Task lifecycles are dictated by application code rules, verified at every step.
3. **Fail-Closed Privacy**: Network egress is disabled by default. If a local model or Ollama node is unreachable, the system fails closed rather than leaking code context to external providers.
4. **Transparent Auditability**: Every plan, sub-task, tool invocation, terminal command, and output diff is logged to SQLite and exposed over SSE.

---

## 2. Multi-Agent Ecosystem

```
                      +-------------------+
                      |   User Request    |
                      +---------+---------+
                                |
                                v
                   +-------------------------+
                   |   Orchestrator Agent    |
                   +------------+------------+
                                |
        +-----------+-----------+-----------+-----------+
        |           |           |           |           |
        v           v           v           v           v
  +-----------++----------++----------++----------++----------+
  | Architect || Developer|| Debugger ||  Tester  || Reviewer  |
  +-----------++----------++----------++----------++----------+
        |                                               |
        +-----------------------------------------------+
                                |
                                v
                   +-------------------------+
                   |    Security Reviewer    |
                   +------------+------------+
                                |
                                v
                   +-------------------------+
                   |  Interactive Approval   |
                   +------------+------------+
                                |
                                v
                   +-------------------------+
                   |  Execution Sandbox &    |
                   |      Workspace          |
                   +-------------------------+
```

### Specialist Agent Responsibilities

| Agent | Responsibility | Permitted Tools | Max Retries |
| :--- | :--- | :--- | :--- |
| **Orchestrator** | Request decomposition, DAG scheduling, transition verification, progress aggregation | Task delegation, status inspection | 3 |
| **Architect** | Workspace file tree analysis, minimal-diff architectural plans, interface definition | `list_files`, `read_file`, `search_files` | 2 |
| **Developer** | Precision file editing, code generation, unified diff synthesis | `read_file`, `write_file`, `apply_patch` | 3 |
| **Debugger** | Error log parsing, root-cause isolation, regression remediation | `read_file`, `search_files`, `run_tests` | 3 |
| **Test Engineer** | Test discovery, test suite execution, regression matrix verification | `run_tests`, `read_file`, `write_file` (tests only) | 2 |
| **Code Reviewer** | Diff inspection, style check, edge-case analysis | `read_file`, `diff_files`, `git_diff` | 1 |
| **Security Reviewer**| Credential leak detection, path escape inspection, risky command auditing | `ast_scan`, `secret_scan`, `policy_check` | 1 |
| **Researcher** | Offline docs retrieval or explicit domain-whitelisted web lookup | `query_local_docs`, `web_search` (if permitted) | 2 |

---

## 3. Task State Machine Transitions

```
[PENDING] 
    │
    ▼ (Initiate Planning)
[PLANNING] ──► (Plan Rejection / Error) ──► [FAILED]
    │
    ▼ (Plan Generated & Actions Require Human Approval)
[WAITING_FOR_APPROVAL]
    │
    ├──► (User Rejection) ──► [CANCELLED]
    │
    ▼ (User Approves Plan/Actions)
[RUNNING] ──► (Dependency Blocked) ──► [BLOCKED]
    │
    ▼ (Execution of code/edits completes)
[VERIFYING] (Runs tests & security scanner)
    │
    ├──► (Tests Pass & Security Clear) ──► [COMPLETED]
    │
    └──► (Test Failure within Retry Budget) ──► [RUNNING] (Debugger activated)
```

Transitions are enforced by `backend.app.execution.state_machine.TaskStateMachine`. Any invalid transition raises `InvalidStateTransitionError`.

---

## 4. Model Registry & Routing

Freedom Agent introduces a provider-agnostic interface:
- **Local Provider (`OllamaProvider`)**: Communicates with `http://127.0.0.1:11434` natively, detecting installed models (e.g. `qwen2.5-coder`, `llama3.2`, `codellama`, `deepseek-coder`).
- **OpenAI-Compatible Adapter (`OpenAICompatibleProvider`)**: Connects to arbitrary hosted or remote self-hosted endpoints supporting `/v1/chat/completions`.
- **Capability Discovery**: Automatically queries or assigns capabilities (`tool_calling`, `structured_output`, `vision`, `context_window_size`). Fallback prompts with structured JSON delimiters are used when native tool calling is unsupported.

---

## 5. Storage Layer

- **Engine**: SQLite via SQLAlchemy 2.0.
- **Tables**:
  - `tasks`: Core task lifecycle, user prompt, state, retry counters, model used.
  - `task_events`: Immutable audit trail of every state change, agent message, and tool execution.
  - `tool_audits`: Exact arguments, execution duration, exit code, stdout/stderr, and approval status.
  - `approvals`: Cryptographically random approval IDs, pending commands, user decision timestamps.
