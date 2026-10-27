# Troubleshooting Guide

### 1. `Cannot connect to Ollama at http://127.0.0.1:11434`
- **Cause**: Ollama is not installed or the desktop application/service is not running.
- **Fix**:
  - Open terminal and run `ollama serve`.
  - Check in browser: `http://127.0.0.1:11434/api/tags`.
  - In `LOCAL_ONLY` mode, Freedom Agent will fail closed if Ollama is unreachable.

### 2. `ExecutionPolicy Error on Windows PowerShell`
- **Error**: `File ...\Activate.ps1 cannot be loaded because running scripts is disabled on this system.`
- **Fix**: Run in PowerShell before activating:
  ```powershell
  Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
  .\venv\Scripts\Activate.ps1
  ```

### 3. `PathTraversalError: Path escapes workspace root`
- **Cause**: The agent attempted to access files outside the designated project folder.
- **Fix**: This is an intentional security protection. Ensure `WORKSPACE_ROOT` in `.env` is set to the parent folder of the project you want Freedom Agent to manage.

### 4. `Task blocked: WAITING_FOR_APPROVAL`
- **Cause**: The agent wants to execute a command (e.g. `npm install`, `git commit`, `rm`) or write a critical configuration file that requires human authorization.
- **Fix**: Open the Web Dashboard, inspect the proposed command and diff, and click **Approve** or **Reject**.

### 5. `ModuleNotFoundError: No module named 'backend'`
- **Fix**: Ensure your `PYTHONPATH` includes the repository root, or run with `python -m backend.app.main` from the root directory.
