@echo off
title Scholarship Eligibility Expert System Launcher
echo ==========================================================
echo   Scholarship Eligibility Expert System - Full-Stack App
echo ==========================================================

set ComSpec=C:\Windows\System32\cmd.exe

echo.
echo [1/2] Launching FastAPI Backend on http://127.0.0.1:8000...
start cmd /k "python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Launching React Vite Frontend on http://localhost:5173...
start cmd /k "cd frontend && set ComSpec=C:\Windows\System32\cmd.exe && npm run dev"

echo.
echo ==========================================================
echo Both servers launched in new windows!
echo   Frontend:  http://localhost:5173
echo   Backend:   http://127.0.0.1:8000
echo   API Docs:  http://127.0.0.1:8000/docs
echo.
echo Default Demo Logins:
echo   Student:  student@scholarship.gov.in  /  student123
echo   Admin:    admin@scholarship.gov.in    /  admin123
echo ==========================================================
pause
