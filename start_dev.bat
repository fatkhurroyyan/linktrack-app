@echo off
echo ===================================================
echo     LinkSense AI (LinkTrack-App) - Dev Launcher
echo ===================================================
echo.
echo [1/2] Starting Backend API (FastAPI) on port 8000...
start cmd /k "cd backend && .venv\Scripts\uvicorn app.main:app --reload --port 8000"

echo [2/2] Starting Frontend App (Vite) on port 5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo Application started!
echo Frontend: http://localhost:5173
echo Backend API Docs: http://127.0.0.1:8000/docs
echo ===================================================
