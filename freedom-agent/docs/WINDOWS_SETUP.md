# Windows + VS Code Installation Guide

A complete, beginner-friendly walkthrough to install and run **Freedom Agent** on Windows 10/11 using PowerShell and VS Code. **No GPU or Administrator rights required.**

---

## 1. Prerequisites Checklist

1. **Git for Windows**: Download from [git-scm.com](https://git-scm.com/) (use default setup options).
2. **Python 3.11 or 3.12**: Download from [python.org](https://www.python.org/downloads/windows/).
   > ⚠️ **IMPORTANT**: During Python setup, check the box: **"Add python.exe to PATH"**!
3. **Node.js (LTS)**: Download from [nodejs.org](https://nodejs.org/).
4. **Visual Studio Code**: Download from [code.visualstudio.com](https://code.visualstudio.com/).
5. **Ollama for Windows**: Download from [ollama.com/download/windows](https://ollama.com/download/windows).

---

## 2. Step-by-Step Setup

### Step A: Clone the Repository
Open **PowerShell** (no admin needed) and navigate to your projects directory:

```powershell
cd $HOME\Projects
git clone https://github.com/your-org/freedom-agent.git
cd freedom-agent
code .
```
*(This opens the project directly in VS Code).*

---

### Step B: Configure Python Virtual Environment
In VS Code, open a new Terminal (`Ctrl + ~` or Terminal -> New Terminal). Ensure it is a **PowerShell** terminal:

```powershell
# Create virtual environment named 'venv'
python -m venv venv

# If PowerShell script execution is restricted, temporarily allow it for this session:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Upgrade pip and install backend dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

---

### Step C: Configure Environment Variables
Copy the example environment file:

```powershell
Copy-Item .env.example .env
```
*(By default, `.env` is set to `PRIVACY_MODE=LOCAL_ONLY` and uses `http://127.0.0.1:11434` for Ollama).*

---

### Step D: Set Up Ollama Local Model
In a separate PowerShell window or terminal:

```powershell
# Verify Ollama is running
ollama --version

# Pull a lightweight model suited for your RAM:
# - For 8GB RAM:
ollama pull qwen2.5-coder:1.5b
# - For 16GB+ RAM:
ollama pull qwen2.5-coder:7b
```

---

### Step E: Run Backend Tests to Verify Setup
In your virtual environment terminal:

```powershell
python -m unittest discover -s backend/tests -p "test_*.py"
```
*(All tests should complete and show `OK`)*.

---

### Step F: Start the Backend Server
```powershell
python -m backend.app.main
```
Your backend will start at: `http://127.0.0.1:8000`. You can test by opening `http://127.0.0.1:8000/api/health` in your browser.

---

### Step G: Start the Web Dashboard
Open a **second** terminal tab in VS Code:

```powershell
cd frontend
npm install
npm run dev
```
Open your browser to: **`http://localhost:5173`**.

---

## 3. Running Your First Task

1. On the web dashboard, enter a task:
   `"Inspect sample_project/calculator.py, add an exponentiation function, and write tests for it."`
2. Select Workspace: `examples/sample_project`
3. Click **Start Task**.
4. Watch the Orchestrator plan, Developer write code, and Test Engineer run verification!
