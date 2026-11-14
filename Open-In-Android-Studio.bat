@echo off
title Bhavya's AI Assistant - Launch in Android Studio
color 0b
echo ========================================================
echo   BHAVYA'S AI ASSISTANT - ANDROID STUDIO LAUNCHER
echo ========================================================
echo.

if exist "%~dp0Bhavya's AI Assistant\package.json" (
    cd /d "%~dp0Bhavya's AI Assistant"
) else (
    cd /d "%~dp0"
)

echo [1/3] Building latest web assets...
call cmd /c "npm run build"
if %errorlevel% neq 0 (
    echo [ERROR] Web build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Syncing latest code with Android native project...
call cmd /c "npx cap sync android"
if %errorlevel% neq 0 (
    echo [ERROR] Capacitor sync failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Launching Android Studio...
set "STUDIO_EXE=C:\Program Files\Android\Android Studio\bin\studio64.exe"
set "ANDROID_PROJ=%CD%\android"

if exist "%STUDIO_EXE%" (
    start "" "%STUDIO_EXE%" "%ANDROID_PROJ%"
    echo.
    echo ========================================================
    echo  SUCCESS! Android Studio is opening the project:
    echo  %ANDROID_PROJ%
    echo.
    echo  QUICK STEPS ONCE ANDROID STUDIO OPENS:
    echo  1. Wait for bottom progress bar ("Gradle sync finished")
    echo  2. Connect your Android phone (or start an emulator)
    echo  3. Click the GREEN PLAY button (Run) or press Shift+F10
    echo ========================================================
) else (
    echo Android Studio not found at standard path, launching via Capacitor CLI...
    call cmd /c "npx cap open android"
)

echo.
echo You can close this window now.
timeout /t 6
