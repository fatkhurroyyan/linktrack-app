Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "    LinkSense AI (LinkTrack-App) - Dev Launcher" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/2] Launching Backend API (FastAPI) on port 8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\backend'; .venv\Scripts\uvicorn app.main:app --reload --port 8000"

Write-Host "[2/2] Launching Frontend App (Vite) on port 5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\frontend'; npm run dev"

Write-Host ""
Write-Host "Application is starting up!" -ForegroundColor Green
Write-Host "Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "Backend Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "===================================================" -ForegroundColor Cyan
