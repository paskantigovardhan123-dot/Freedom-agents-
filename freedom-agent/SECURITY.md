# Security Policy

Freedom Agent treats security, privacy, and execution safety as primary design constraints, not secondary features.

## Reporting a Vulnerability

If you discover a security vulnerability in Freedom Agent, please **do not** open a public issue. Instead, report it privately to our security team or email `security@freedom-agent.org`.

We aim to respond to reports within 48 hours and coordinate remediation before public disclosure.

## Security Architecture & Design Principles

1. **Workspace Boundary Containment**:
   - Every file operation is strictly resolved against the absolute canonical workspace path.
   - Symbolic link escapes and `../` path traversal attempts are detected and rejected.
2. **Deterministic State Machine Enforcement**:
   - Agents cannot transition their own state or elevate their permissions.
   - Only application code can transition a task from `PLANNING` to `WAITING_FOR_APPROVAL` or `RUNNING`.
3. **Command Allowlist & Interactive Approval**:
   - Benign, non-destructive read operations (`git status`, `git diff`, `pytest`, `npm test`) can be executed according to the active policy.
   - Risky or destructive commands (`rm`, `git commit`, `git push`, arbitrary shell scripts) require explicit, verified approval from the user via the API/Web UI.
4. **Secret Redaction**:
   - Environment variables, stdout/stderr streams, and audit logs are sanitized through regex patterns to mask API keys, tokens, and authorization headers (`sk-...`, `Bearer ...`).
5. **Fail-Closed Privacy Modes**:
   - In `LOCAL_ONLY` mode, any attempt to make external HTTP requests or resolve external model providers immediately fails closed with an informative error.
