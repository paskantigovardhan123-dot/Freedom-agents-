@echo off
title FREEDOM AGENT - Windows EXE Builder
color 0B
cls
echo =====================================================================
echo            FREEDOM AGENT - BUILD STANDALONE WINDOWS EXE
echo =====================================================================
echo.
echo This script packages Freedom Agent into a standalone native Windows (.exe)
echo using PyInstaller. The resulting .exe can run on any Windows PC without
echo requiring Python or external packages to be pre-installed.
echo.

:: 1. Verify Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not found in PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    echo Ensure you check "Add python.exe to PATH" during installation.
    pause
    exit /b 1
)

echo [1/4] Python detected. Installing PyInstaller and build dependencies...
python -m pip install --upgrade pip
python -m pip install pyinstaller fastapi uvicorn pydantic

echo.
echo [2/4] Packaging Freedom Agent backend into FreedomAgent.exe...
python -m PyInstaller --noconfirm --clean ^
    --onefile ^
    --name "FreedomAgent" ^
    --paths "freedom-agent" ^
    --collect-all "backend" ^
    --hidden-import "uvicorn" ^
    --hidden-import "fastapi" ^
    --hidden-import "pydantic" ^
    freedom-agent\backend\app\main.py

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] PyInstaller build failed! Please check the output above.
    pause
    exit /b 1
)

echo.
echo [3/4] Copying executable to project root...
if exist dist\FreedomAgent.exe (
    copy /y dist\FreedomAgent.exe FreedomAgent.exe >nul
    echo [OK] Created: FreedomAgent.exe in root directory!
)

echo.
echo =====================================================================
echo [SUCCESS] FreedomAgent.exe is ready!
echo You can now double-click FreedomAgent.exe to launch the server anytime.
echo =====================================================================
pause
