@echo off
title Jarvis - Local AI Assistant

rem %~dp0 resolves to the drive + folder this .bat file is running
rem from, so this works no matter what drive letter the folder
rem ends up on.
set "BASE=%~dp0"

cd /d "%BASE%"

echo.
echo ==================================================
echo              JARVIS IS STARTING
echo ==================================================
echo.
echo Running from: %BASE%
echo.

echo [1/2] Starting Jarvis AI Server...
echo.

start "Jarvis AI Server" powershell -NoProfile -Command ^
"llama-server -m '%BASE%models\hub\models--Qwen--Qwen3-4B-GGUF\blobs\7485fe6f11af29433bc51cab58009521f205840f5b4ae3a32fa7f92e8534fdf5' -ngl 99 --ctx-size 8192 --host 127.0.0.1 --port 8080"

echo Waiting for the AI server to start...
timeout /t 10 /nobreak >nul

echo.
echo [2/2] Starting Jarvis Popup UI...
echo.

rem pythonw.exe has no console window and is launched detached
rem with "start" - closing THIS window afterward won't touch it
rem or the AI server, since both are now separate processes.
if exist "%BASE%app\.venv\Scripts\pythonw.exe" (
    start "" "%BASE%app\.venv\Scripts\pythonw.exe" "%BASE%app\interface.py"
) else (
    start "" pythonw "%BASE%app\interface.py"
)

echo.
echo Everything is running in the background.
echo Press Ctrl+Space anywhere to show the JARVIS popup.
echo This window will close automatically - that does NOT
echo stop the server or the popup, they keep running.
echo.

timeout /t 3 /nobreak >nul
exit