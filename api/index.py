import sys
import os

# Add backend directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", "backend"))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Import the FastAPI application instance
from app.main import app

# Add debug endpoint to check env vars on Vercel
from fastapi.responses import JSONResponse

@app.get("/debug/env")
async def debug_env():
    from app.config import settings
    db_url = settings.DATABASE_URL
    # Mask sensitive parts
    if "postgresql" in db_url or "postgres" in db_url:
        masked = db_url[:30] + "...MASKED..."
    elif "sqlite" in db_url:
        masked = db_url  # sqlite is safe to show
    else:
        masked = "UNKNOWN TYPE"
    
    return JSONResponse({
        "database_url_type": "postgresql/supabase" if "postgres" in db_url else "sqlite" if "sqlite" in db_url else "other",
        "database_url_masked": masked,
        "has_DATABASE_URL_env": "DATABASE_URL" in os.environ,
        "env_DATABASE_URL_starts_with": os.environ.get("DATABASE_URL", "NOT SET")[:25] + "..." if os.environ.get("DATABASE_URL") else "NOT SET",
    })
