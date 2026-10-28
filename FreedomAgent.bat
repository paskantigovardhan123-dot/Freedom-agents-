@echo off
title FREEDOM AGENT - Multi-Agent AI Command Center
color 0A
cls

echo =====================================================================
echo                FREEDOM AGENT - COMMAND CENTER LAUNCHER
echo =====================================================================
echo.

:: Check if standalone FreedomAgent.exe exists
if exist FreedomAgent.exe (
    echo [INFO] Found standalone FreedomAgent.exe! Launching executable...
    start "" FreedomAgent.exe
    timeout /t 2 >nul
    start http://127.0.0.1:8000/docs
    goto END
)

:: Check Python installation
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in your Windows PATH!
    echo.
    echo To fix this:
    echo 1. Download Python 3.11+ from https://www.python.org/downloads/
    echo 2. Check the box "Add Python to PATH" during installation.
    echo 3. Run this file again.
    echo.
    pause
    exit /b 1
)

echo [1/3] Python detected. Checking environment configuration...
if not exist .env (
    if exist .env.example (
        copy .env.example .env >nul
        echo [OK] Initialized default .env configuration.
    )
)

echo [2/3] Checking Ollama local service...
curl -s http://127.0.0.1:11434/api/tags >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Ollama is running locally on http://127.0.0.1:11434
) else (
    echo [WARN] Ollama is not currently running.
    echo For local-only privacy mode, please start Ollama (https://ollama.ai).
    echo Freedom Agent will still launch in standby mode.
)

echo.
echo [3/3] Starting Freedom Agent Multi-Agent Server...
echo Server URL: http://127.0.0.1:8000
echo Web UI:     http://127.0.0.1:8000/docs
echo.
echo Opening browser in 2 seconds...
start http://127.0.0.1:8000/docs

:: Start the Python backend
set PYTHONPATH=%CD%\freedom-agent;%PYTHONPATH%
python freedom-agent\backend\app\main.py

:END
pause
