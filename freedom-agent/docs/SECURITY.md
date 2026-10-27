# Security & Sandbox Specification

## 1. Threat Model & Assumptions

Freedom Agent is designed for developers running automated coding workflows. Coding agents inherently require file generation, execution of tests, and running terminal commands. 

### Untrusted Inputs
- **Prompt Content**: User prompts or imported external tasks.
- **Repository Content**: Untrusted dependencies, malicious `Makefile`, rogue pre-commit hooks, or prompt injection in markdown/comments.
- **Model Output**: Hallucinated file paths, unauthorized destructive commands (`rm -rf /`, `curl | sh`), or attempts to access credentials.

---

## 2. Sandbox Protections

### A. Filesystem Path Traversal Protection
All file operations pass through `ExecutionSandbox.validate_path(path)`:
1. Converts the target path to an absolute path using `os.path.realpath`.
2. Resolves any symbolic links to ensure the target canonical path is strictly inside `WORKSPACE_ROOT`.
3. Verifies that the resolved path starts with the workspace prefix.
4. Denies reading sensitive file patterns such as:
   - `.env`, `.git/config`, `id_rsa`, `id_ed25519`, `credentials.json`, `*secret*`, `*token*`.

### B. Command Execution Boundaries
All terminal actions run via `backend.app.tools.terminal.TerminalTool`:
- Shell execution is performed with list arguments (avoiding `shell=True` where possible).
- Prohibited command tokens:
  - `rm -rf /`, `mkfs`, `dd if=`, `:(){ :|:& };:`, `shutdown`, `reboot`, `wget ... | bash`, `curl ... | sh`.
- Mandatory Interactive Approval:
  - Any command that modifies git history, deletes directories, or executes external scripts stops in `WAITING_FOR_APPROVAL` state. The user must manually click "Approve" or issue `POST /api/tasks/{id}/approve`.

### C. Secret Redaction Engine
Any string output from tool execution, standard error, standard output, or task logs is processed through `RedactionEngine`:
- Regex filters mask:
  - OpenAI keys: `sk-[a-zA-Z0-9_-]{20,}` -> `sk-***REDACTED***`
  - GitHub PATs: `ghp_[a-zA-Z0-9]{36}` -> `ghp_***REDACTED***`
  - Generic Bearer tokens: `Bearer [A-Za-z0-9\._-]{20,}` -> `Bearer ***REDACTED***`
  - Private keys: `-----BEGIN [A-Z ]+ PRIVATE KEY-----` -> `[PRIVATE KEY REDACTED]`

---

## 3. Sandboxing on Windows vs Containers

- **Containerized Environment**: Recommended for running untrusted code. Uses Linux namespaces, cgroups, and read-only system volumes.
- **Native Windows Environment**: When Docker is unavailable, Windows processes run with user privileges. Freedom Agent relies on:
  1. Strict canonical path resolution.
  2. Command approval gating.
  3. Timeout enforcement on all child processes.
  4. Redaction of sensitive environment variables.
