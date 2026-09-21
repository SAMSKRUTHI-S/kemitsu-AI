@echo off
title Demon Slayer Groq Chatbot
echo ===================================================
echo   Kimetsu AI - Demon Slayer Groq & Flask Chatbot
echo ===================================================
echo Starting Flask Server...

REM Try standard python, conda python, or Orange python
where python >nul 2>nul
if %errorlevel% equ 0 (
    python app.py
) else if exist "C:\Users\student\.conda\envs\node2vec_demo\python.exe" (
    "C:\Users\student\.conda\envs\node2vec_demo\python.exe" app.py
) else (
    "C:\Program Files\Orange\python.exe" app.py
)

pause
