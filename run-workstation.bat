@echo off
title Bhavya's AI Assistant Launcher
cd /d "%~dp0"
echo ===================================================
echo   Starting Bhavya's AI Assistant Desktop App...
echo ===================================================

:: Set CORS origins permission for Ollama server
set OLLAMA_ORIGINS=*

:: Check if Ollama is running, launch it if not
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [OK] Ollama local inference server is active.
) else (
    echo [info] Starting Ollama with CORS support...
    start "" ollama serve
    timeout /t 3 >nul
)

:: Launch the standalone native Windows executable if present
if exist "release\Bhavya's AI Assistant-win32-x64\Bhavya's AI Assistant.exe" (
    echo [info] Launching standalone native desktop app...
    start "" "release\Bhavya's AI Assistant-win32-x64\Bhavya's AI Assistant.exe"
    exit /b 0
)

:: Fallback to local electron runtime
echo [info] Launching application via Electron...
node_modules\.bin\electron.cmd .

echo ===================================================
echo   Application closed.
echo ===================================================
timeout /t 2 >nul
