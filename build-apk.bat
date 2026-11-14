@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=C:\Users\bhavy\AppData\Local\Android\Sdk"

echo Building latest web assets...
cd /d "%~dp0"
call npm run build
call npx cap sync android

echo Using Java from: %JAVA_HOME%
"%JAVA_HOME%\bin\javac.exe" -version

cd /d "%~dp0android"
call gradlew.bat --stop
call gradlew.bat assembleDebug

if exist "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" (
    echo APK Build SUCCESS!
    copy /y "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0..\Bhavyas-AI-Assistant.apk"
    copy /y "%~dp0android\app\build\outputs\apk\debug\app-debug.apk" "%~dp0Bhavyas-AI-Assistant.apk"
    echo Copied APK to Desktop and Project root!
) else (
    echo APK Build FAILED!
)
