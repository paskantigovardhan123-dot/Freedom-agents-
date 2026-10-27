.PHONY: help install test lint format run-backend run-frontend dev

help:
	@echo "Freedom Agent - Development Commands"
	@echo "  make install       Install all Python & frontend dependencies"
	@echo "  make test          Run backend test suite"
	@echo "  make lint          Run linter and type-checker"
	@echo "  make run-backend   Start the FastAPI backend server"
	@echo "  make run-frontend  Start Vite development server"
	@echo "  make dev           Start both backend and frontend concurrently"

install:
	pip install -r requirements.txt
	cd frontend && npm install

test:
	python3 -m unittest discover -s backend/tests -p "test_*.py"

lint:
	ruff check backend
	mypy backend/app

format:
	ruff format backend

run-backend:
	python3 -m backend.app.main

run-frontend:
	cd frontend && npm run dev
