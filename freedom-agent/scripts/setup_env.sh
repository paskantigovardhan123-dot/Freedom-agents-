#!/usr/bin/env bash
set -e

echo "=== Freedom Agent Environment Setup ==="

# Check Python version
python_ver=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "Detected Python: $python_ver"

if [ ! -d "venv" ]; then
    echo "Creating virtual environment 'venv'..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "Running test suite to verify installation..."
python3 -m unittest discover -s backend/tests -p "test_*.py"

echo "=== Setup complete! ==="
echo "To run the backend:  python3 -m backend.app.main"
echo "To run the frontend: cd frontend && npm install && npm run dev"
