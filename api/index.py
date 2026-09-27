import sys
import os
import traceback
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

# Fallback app - Vercel needs `app` at module level
app = FastAPI()

# Add backend directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

_startup_error = None

try:
    from app.main import app as _real_app
    # Success - replace fallback with real app
    app = _real_app
    
    # Add debug endpoint to real app
    @app.get("/debug/env")
    async def debug_env():
        from app.config import settings
        db_url = settings.DATABASE_URL
        return {
            "db_type": "supabase" if "postgres" in db_url else "sqlite",
            "db_url_preview": db_url[:35] + "..." if len(db_url) > 35 else db_url,
            "has_env_var": "DATABASE_URL" in os.environ,
        }

except Exception:
    _startup_error = traceback.format_exc()

    @app.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"])
    async def show_error(full_path: str):
        return PlainTextResponse(
            f"=== BACKEND STARTUP CRASH ===\n\n{_startup_error}",
            status_code=500,
        )
