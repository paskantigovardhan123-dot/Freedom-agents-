# Contributing to Freedom Agent

Thank you for your interest in Freedom Agent! As an open-source, privacy-first multi-agent framework, we welcome contributions from engineers, researchers, and security practitioners.

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and constructive in all discussions.

## Development Workflow

1. **Fork & Branch**: Create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. **Setup Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # or .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```
3. **Coding Standards**:
   - Python code must conform to PEP 8 and pass `ruff check` and type hints.
   - All tool execution must respect `ExecutionSandbox` workspace bounds.
   - Never add tools that execute arbitrary untrusted shell strings without prior user approval.
4. **Writing Tests**:
   - Every new agent, tool, or state machine rule must include unit tests.
   - Run tests before submitting:
     ```bash
     python3 -m unittest discover -s backend/tests -p "test_*.py"
     ```
5. **Pull Requests**:
   - Keep pull requests focused on a single issue or capability.
   - Describe what the PR solves, which tests were run, and any potential security considerations.
