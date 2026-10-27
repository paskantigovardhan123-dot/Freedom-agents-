# FREEDOM AGENT

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](freedom-agent/LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-green.svg)](freedom-agent/pyproject.toml)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111%2B-teal.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-cyan.svg)](freedom-agent/frontend/)
[![Android Compose](https://img.shields.io/badge/Android-Jetpack%20Compose%20M3-brightgreen.svg)](app/)
[![Ollama Compatible](https://img.shields.io/badge/Ollama-Offline%20First-orange.svg)](https://ollama.ai)

**Freedom Agent** is a modular, privacy-first, multi-agent AI coding and automation framework designed to run locally with **Ollama** or connect to compatible hosted model providers under strict user consent, sandboxed execution, and transparent security policies.

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
- 📱 **Triple Interface**:
  - **CLI**: Direct terminal operation with `freedom-agent` command line tool.
  - **Web Dashboard**: Modern React + TypeScript + Vite dashboard with live state timeline, diff viewer, terminal approval dialog, agent inspector, and policy switcher.
  - **Mobile Companion**: Android Compose client for monitoring and remote approval.

---

## 📁 Repository Structure

```
.
├── freedom-agent/             # Freedom Agent Core Framework
│   ├── backend/
│   │   ├── app/
│   │   │   ├── main.py        # FastAPI server entrypoint
│   │   │   ├── cli.py         # Terminal CLI tool
│   │   │   ├── api/routes.py  # REST API endpoints
│   │   │   ├── core/          # Config & Redaction security
│   │   │   ├── schemas/       # Typed agent messages, task states & policies
│   │   │   ├── execution/     # Deterministic State Machine, Sandbox & Approvals
│   │   │   ├── tools/         # File, Terminal, Git, Test Runner, Browser tools
│   │   │   ├── models/        # Ollama & OpenAI-compatible provider registry
│   │   │   ├── memory/        # SQLite context persistence & retention
│   │   │   └── agents/        # Orchestrator, Architect, Developer, Debugger, Tester, etc.
│   │   └── tests/             # 17 automated unit and integration tests (passing 100%)
│   ├── frontend/              # Web Dashboard (React + TypeScript + Vite)
│   ├── docs/                  # ARCHITECTURE, SECURITY, PRIVACY, WINDOWS_SETUP, TROUBLESHOOTING
│   ├── examples/              # Sample calculator project with tests
│   └── scripts/               # Setup & automated demonstration scripts
└── app/                       # Freedom Agent Android Mobile Companion & Monitor
```

---

## 🚀 Quick Start (Local with Ollama)

### 1. Run Freedom Agent Backend

```bash
cd freedom-agent
python3 -m venv venv
source venv/bin/activate       # On Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env

# Run full test suite (17/17 tests passing)
PYTHONPATH=. python3 -m unittest discover -s backend/tests -p "test_*.py"

# Start the API server
python3 -m backend.app.main
```

### 2. Run Freedom Agent CLI

```bash
cd freedom-agent
python3 -m backend.app.cli status
python3 -m backend.app.cli agents
python3 -m backend.app.cli run --task "Add power function" --workspace examples/sample_project
```

### 3. Run Web Dashboard

```bash
cd freedom-agent/frontend
npm install
npm run dev
# Dashboard launches at http://localhost:5173
```

### 4. Build and Run Android Mobile Companion

```bash
gradle assembleDebug
gradle :app:testDebugUnitTest
```

---

## 📜 Documentation

- [Windows Setup Guide](freedom-agent/docs/WINDOWS_SETUP.md)
- [Security & Sandbox Model](freedom-agent/docs/SECURITY.md)
- [Privacy Modes & Policies](freedom-agent/docs/PRIVACY.md)
- [Architecture Deep Dive](freedom-agent/docs/ARCHITECTURE.md)
- [Troubleshooting](freedom-agent/docs/TROUBLESHOOTING.md)

---

## ⚖️ License

Distributed under the **MIT License**.
