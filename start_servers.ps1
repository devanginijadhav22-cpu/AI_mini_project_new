# Windows PowerShell Quick Launcher for Scholarship Eligibility Expert System
$Host.UI.RawUI.WindowTitle = "Scholarship Eligibility Expert System Launcher"
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Scholarship Eligibility Expert System - Full-Stack App  " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$env:ComSpec = "C:\Windows\System32\cmd.exe"
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Backend in separate process
$pythonCmd = if (Get-Command py -ErrorAction SilentlyContinue) { "py" } else { "python" }
Write-Host "`n[1/2] Starting FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot'; $pythonCmd -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

Start-Sleep -Seconds 3

# 2. Start Frontend in separate process
Write-Host "[2/2] Starting React Vite Frontend on http://localhost:5173..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$projectRoot\frontend'; `$env:ComSpec = 'C:\Windows\System32\cmd.exe'; npm run dev"

Write-Host "`n==========================================================" -ForegroundColor Yellow
Write-Host "Both servers launched successfully!" -ForegroundColor Yellow
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  Backend:   http://127.0.0.1:8000" -ForegroundColor White
Write-Host "  API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "`nDefault Demo Credentials:" -ForegroundColor Yellow
Write-Host "  Student:  student@scholarship.gov.in  /  student123" -ForegroundColor White
Write-Host "  Admin:    admin@scholarship.gov.in    /  admin123" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Yellow
