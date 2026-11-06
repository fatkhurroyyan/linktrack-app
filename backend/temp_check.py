import asyncio
import sys
from app.config import settings
from app.database.session import AsyncSessionLocal
from app.models.link_item import LinkItem, Category, LinkTag, GDriveFile
from sqlalchemy import select, func, desc

sys.stdout.reconfigure(encoding="utf-8")

async def main():
    async with AsyncSessionLocal() as session:
        host = settings.DATABASE_URL.split("@")[-1]
        cats = (await session.execute(select(func.count(Category.id)))).scalar()
        links = (await session.execute(select(func.count(LinkItem.id)))).scalar()
        tags = (await session.execute(select(func.count(LinkTag.id)))).scalar()
        gfiles = (await session.execute(select(func.count(GDriveFile.id)))).scalar()

        print("==========================================================")
        print("  STATUS TABEL DATABASE MICROSOFT AZURE POSTGRESQL")
        print("==========================================================")
        print(f"Server Host          : {host}")
        print(f"Tabel 'categories'   : {cats} baris")
        print(f"Tabel 'link_items'   : {links} baris")
        print(f"Tabel 'link_tags'    : {tags} baris")
        print(f"Tabel 'gdrive_files' : {gfiles} baris")
        print("----------------------------------------------------------")
        print("5 LINK TERBARU DI DATABASE AZURE:")
        print("----------------------------------------------------------")

        stmt = select(LinkItem).order_by(desc(LinkItem.created_at)).limit(5)
        recent_links = (await session.execute(stmt)).scalars().all()
        for idx, item in enumerate(recent_links, 1):
            waktu = item.created_at.strftime("%Y-%m-%d %H:%M:%S") if item.created_at else "-"
            print(f"{idx}. [{waktu}] {item.title}")
            print(f"   URL      : {item.url}")
            print(f"   Kategori : {item.primary_category} | Platform: {item.platform}")
        print("==========================================================")

asyncio.run(main())
