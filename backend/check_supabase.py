import asyncio
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.config import settings
from app.database.session import init_db, AsyncSessionLocal
from sqlalchemy import text

async def main():
    print("1. Cek DATABASE_URL di settings:")
    print("   ->", settings.DATABASE_URL)
    
    print("\n2. Inisialisasi Database (init_db):")
    try:
        await init_db()
        print("   -> [OK] init_db berhasil!")
    except Exception as e:
        print("   -> [ERROR init_db]:", type(e).__name__, str(e))
        return

    print("\n3. Eksekusi Test Query (SELECT 1):")
    try:
        async with AsyncSessionLocal() as session:
            res = await session.execute(text("SELECT 1"))
            print("   -> [OK] Query result:", res.scalar())
    except Exception as e:
        print("   -> [ERROR Query]:", type(e).__name__, str(e))

if __name__ == "__main__":
    asyncio.run(main())
