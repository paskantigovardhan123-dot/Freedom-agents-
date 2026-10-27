# Sample Project: Calculator

This is a clean, minimal Python project used for automated tests and sandbox verification in Freedom Agent.

### Files
- `calculator.py`: Basic math functions
- `test_calculator.py`: Python unit tests

### Example Freedom Agent Task
```bash
python3 -m backend.app.cli run \
  --task "Add power(base, exp) function with tests" \
  --workspace examples/sample_project
```
