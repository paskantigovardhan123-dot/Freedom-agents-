# Freedom Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-green.svg)](pyproject.toml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-teal.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](frontend/)
[![Ollama Compatible](https://img.shields.io/badge/Ollama-Offline%20First-orange.svg)](https://ollama.ai)

**Freedom Agent** is a modular, privacy-first, multi-agent AI coding and automation framework designed to run locally with **Ollama** or connect seamlessly to compatible hosted endpoints with strict user consent, sandboxed execution, and transparent security policies.

---

## 🌟 Key Highlights

- 🔒 **Privacy-First Architecture**: 3 explicit operating modes:
  - **Local Only**: Strict offline operation with Ollama. Zero external telemetry or silent fallbacks.
  - **Private Hybrid**: Local models prioritized; explicit prompt consent required before routing context externally.
  - **Hosted Providers**: Configurable OpenAI-compatible endpoints with secret redaction and credential protection.
- 🤖 **Specialized Multi-Agent Team**:
  - **Orchestrator**: Multi-step plan generation, dependency DAG, bounded retries, state machine enforcement.
  - **Software Architect**: Minimal-change design, component boundary analysis, risk assessment.
  - **Developer**: Safe bounded patch edits, convention preservation, syntax validation.
  - **Debugger**: Root cause analysis from real logs, targeted repairs.
  - **Test Engineer**: Framework discovery, automated regression checks, passed/failed tracking.
  - **Code Reviewer**: Diff validation, style consistency, fragile assumption detection.
  - **Security Reviewer**: AST credential scanning, path traversal checks, unsafe command detection.
  - **Researcher**: Offline knowledge retrieval or bounded web research with source attribution.
- 🛡️ **Workspace Execution Sandbox**:
  - Path traversal & symbolic link jailbreak protection.
  - Command allowlisting & mandatory interactive user approval for destructive commands (`rm -rf`, `git push --force`, `drop table`, etc.).
  - Real subprocess execution with timeout and output capture.
- 📊 **Dual Interface**:
  - **Web Dashboard**: Modern React + TypeScript + Vite dashboard with live state timeline, diff viewer, terminal approval dialog, agent inspector, and policy switcher.
  - **CLI**: Direct terminal operation with `freedom-agent` command line tool.
  - **Mobile Companion**: Android Compose client for monitoring and remote approval.

---

## 🚀 Quick Start (Local with Ollama)

### Prerequisites

- Python 3.11+
- Node.js 18+ (for Web Dashboard)
- [Ollama](https://ollama.ai) installed and running: `ollama run qwen2.5-coder:7b` (or `llama3.2`)

### 1. Clone & Set Up Backend

```bash
git clone https://github.com/your-org/freedom-agent.git
cd freedom-agent

# Create virtual environment
python3 -m venv venv
# Linux / macOS:
source venv/bin/activate
# Windows PowerShell:
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Run database setup & tests
python3 -m unittest discover -s backend/tests -p "test_*.py"
```

### 2. Start the Backend API

```bash
python3 -m backend.app.main
# Server starts at http://127.0.0.1:8000
# API docs available at http://127.0.0.1:8000/docs
```

### 3. Start the Web Dashboard

```bash
cd frontend
npm install
npm run dev
# Dashboard launches at http://localhost:5173
```

### 4. Or Run via CLI

```bash
python3 -m backend.app.cli --help
python3 -m backend.app.cli run --task "Add divide method and unit tests to calculator.py" --workspace ./examples/sample_project
```

---

## 🏗️ Architecture & Task State Machine

```
PENDING ──► PLANNING ──► WAITING_FOR_APPROVAL ──► RUNNING ──► VERIFYING ──► COMPLETED
   │            │                 │                   │            │
   ▼            ▼                 ▼                   ▼            ▼
 CANCELLED    FAILED           REJECTED             BLOCKED      FAILED / RETRY
```

Every task passes through deterministic lifecycle stages. No language model can self-authorize dangerous commands or bypass the state machine.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full design specifications.

---

## 📜 Documentation

- [Windows Setup Guide](docs/WINDOWS_SETUP.md) - Step-by-step PowerShell guide without requiring GPU or Admin.
- [Security & Sandbox Model](docs/SECURITY.md) - Path resolution, command allowlists, secret redaction.
- [Privacy Modes & Policies](docs/PRIVACY.md) - Local vs Hybrid vs Hosted data flows.
- [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and resolutions.

---

## 🛡️ Security & Disclosures

See [SECURITY.md](SECURITY.md) for our vulnerability reporting policy. Freedom Agent enforces least-privilege permissions, prevents remote data leakage by default, and never auto-executes destructive operations.

---

## ⚖️ License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
