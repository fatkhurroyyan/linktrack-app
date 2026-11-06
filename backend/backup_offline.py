import asyncio
import json
import os
import sys
from datetime import datetime

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.config import settings
from app.database.session import Base, get_normalized_database_url
from app.models.link_item import Category, GDriveFile, LinkItem, LinkTag
from app.services.export_service import export_service


async def run_offline_backup():
    cloud_url = get_normalized_database_url(settings.DATABASE_URL)
    sqlite_url = "sqlite+aiosqlite:///./linktrack.db"

    print("==========================================================")
    print("  DOWNLOAD BACKUP OFFLINE DARI MICROSOFT AZURE")
    print("==========================================================")

    src_engine = create_async_engine(cloud_url, echo=False, pool_pre_ping=True)
    SrcSession = async_sessionmaker(bind=src_engine, class_=AsyncSession, expire_on_commit=False)

    async with SrcSession() as src_session:
        categories = (await src_session.execute(select(Category))).scalars().all()
        stmt = (
            select(LinkItem)
            .options(selectinload(LinkItem.tags), selectinload(LinkItem.gdrive_files))
            .order_by(desc(LinkItem.created_at))
        )
        links = list((await src_session.execute(stmt)).scalars().unique().all())

        # 1. Simpan ke JSON (Full Database Dump)
        json_path = os.path.join(os.path.dirname(__file__), "backup_linktrack.json")
        backup_payload = {
            "exported_at": datetime.now().isoformat(),
            "total_categories": len(categories),
            "total_links": len(links),
            "categories": [
                {
                    "id": c.id,
                    "name": c.name,
                    "is_system": c.is_system,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in categories
            ],
            "links": [
                {
                    "id": item.id,
                    "url": item.url,
                    "platform": item.platform,
                    "title": item.title,
                    "primary_category": item.primary_category,
                    "secondary_category": item.secondary_category,
                    "subcategory": item.subcategory,
                    "summary": item.summary,
                    "original_description": item.original_description,
                    "primary_language": item.primary_language,
                    "item_count": item.item_count,
                    "total_size_bytes": item.total_size_bytes,
                    "favicon_url": item.favicon_url,
                    "raw_metadata": item.raw_metadata,
                    "created_at": item.created_at.isoformat() if item.created_at else None,
                    "updated_at": item.updated_at.isoformat() if item.updated_at else None,
                    "tags": [t.tag_name for t in item.tags],
                    "gdrive_files": [
                        {
                            "file_name": gf.file_name,
                            "mime_type": gf.mime_type,
                            "file_size_bytes": gf.file_size_bytes,
                            "web_view_link": gf.web_view_link,
                        }
                        for gf in item.gdrive_files
                    ],
                }
                for item in links
            ],
        }
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(backup_payload, f, ensure_ascii=False, indent=2)
        print(f"1. [OK] Backup JSON tersimpan di   : {json_path}")

        # 2. Simpan ke Excel (.xlsx)
        xlsx_path = os.path.join(os.path.dirname(__file__), "backup_linktrack.xlsx")
        excel_bytes = export_service.export_to_excel(links)
        with open(xlsx_path, "wb") as f:
            f.write(excel_bytes.getvalue())
        print(f"2. [OK] Backup Excel tersimpan di  : {xlsx_path}")

        # 3. Sinkronkan ke SQLite Lokal (linktrack.db)
        if not cloud_url.startswith("sqlite"):
            tgt_engine = create_async_engine(sqlite_url, echo=False)
            async with tgt_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            TgtSession = async_sessionmaker(bind=tgt_engine, class_=AsyncSession, expire_on_commit=False)
            async with TgtSession() as tgt_session:
                for cat in categories:
                    if not (await tgt_session.execute(select(Category).where(Category.name == cat.name))).scalars().first():
                        tgt_session.add(Category(id=cat.id, name=cat.name, is_system=cat.is_system, created_at=cat.created_at))
                await tgt_session.commit()
                for item in links:
                    if not (await tgt_session.execute(select(LinkItem).where(LinkItem.url == item.url))).scalars().first():
                        tgt_session.add(
                            LinkItem(
                                id=item.id,
                                url=item.url,
                                platform=item.platform,
                                title=item.title,
                                primary_category=item.primary_category,
                                secondary_category=item.secondary_category,
                                subcategory=item.subcategory,
                                summary=item.summary,
                                original_description=item.original_description,
                                primary_language=item.primary_language,
                                item_count=item.item_count,
                                total_size_bytes=item.total_size_bytes,
                                favicon_url=item.favicon_url,
                                raw_metadata=item.raw_metadata,
                                created_at=item.created_at,
                                updated_at=item.updated_at,
                            )
                        )
                        await tgt_session.flush()
                        for t in item.tags:
                            tgt_session.add(LinkTag(id=t.id, link_id=item.id, tag_name=t.tag_name))
                        for gf in item.gdrive_files:
                            tgt_session.add(
                                GDriveFile(
                                    id=gf.id,
                                    link_id=item.id,
                                    file_name=gf.file_name,
                                    mime_type=gf.mime_type,
                                    file_size_bytes=gf.file_size_bytes,
                                    web_view_link=gf.web_view_link,
                                )
                            )
                await tgt_session.commit()
            await tgt_engine.dispose()
        sqlite_path = os.path.join(os.path.dirname(__file__), "linktrack.db")
        print(f"3. [OK] Backup SQLite tersimpan di : {sqlite_path}")

    await src_engine.dispose()
    print("==========================================================")
    print(f"SELESAI! Total {len(links)} link & {len(categories)} kategori berhasil di-backup offline.")


if __name__ == "__main__":
    asyncio.run(run_offline_backup())

