import asyncio
import os
import sys
from urllib.parse import urlparse

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.database.session import Base, get_normalized_database_url
from app.models.link_item import Category, GDriveFile, LinkItem, LinkTag


async def check_tcp_port(host: str, port: int = 5432, timeout: float = 6.0) -> bool:
    try:
        conn = asyncio.open_connection(host, port)
        reader, writer = await asyncio.wait_for(conn, timeout=timeout)
        writer.close()
        await writer.wait_closed()
        return True
    except Exception:
        return False


async def migrate(source_url: str, target_url: str):
    src_norm = get_normalized_database_url(source_url.strip())
    tgt_norm = get_normalized_database_url(target_url.strip())

    parsed_tgt = urlparse(tgt_norm.replace("postgresql+asyncpg://", "postgresql://"))
    tgt_host = parsed_tgt.hostname or "linktrack-azure-db.postgres.database.azure.com"
    tgt_port = parsed_tgt.port or 5432

    print(f"1. Mengecek akses jaringan/Firewall ke Azure ({tgt_host}:{tgt_port})...")
    is_open = await check_tcp_port(tgt_host, tgt_port)
    if not is_open:
        print("\n[!] GAGAL TERHUBUNG KE PORT 5432 DI MICROSOFT AZURE (WinError 121 / Timeout)!")
        print("Penyebab: Firewall di Azure Portal belum mengizinkan IP internet kamu.")
        print("\nSolusi di Azure Portal (Hanya 1 Menit):")
        print("  1. Buka server 'linktrack-azure-db' di https://portal.azure.com")
        print("  2. Di menu sebelah kiri, pilih 'Settings' -> 'Networking'")
        print("  3. Pastikan 'Public access (allowed IP addresses)' sudah tercentang")
        print("  4. Di bagian 'Firewall rules':")
        print("     - Klik '+ Add current client IP address'")
        print("     - Klik '+ Add 0.0.0.0 - 255.255.255.255' (agar semua IP & Vercel diizinkan)")
        print("  5. WAJIB KLIK TOMBOL 'Save' di bagian atas, lalu tunggu ~1 menit sampai selesai menyimpan!")
        sys.exit(1)
    print("   -> [OK] Port 5432 Azure terbuka dan siap menerima koneksi!")

    print("2. Menghubungkan ke Source Database (Supabase) & Target Database (Azure)...")
    src_engine = create_async_engine(src_norm, echo=False, pool_pre_ping=True)
    tgt_engine = create_async_engine(tgt_norm, echo=False, pool_pre_ping=True)

    SrcSession = async_sessionmaker(bind=src_engine, class_=AsyncSession, expire_on_commit=False)
    TgtSession = async_sessionmaker(bind=tgt_engine, class_=AsyncSession, expire_on_commit=False)

    print("3. Membuat tabel otomatis di Microsoft Azure PostgreSQL...")
    async with tgt_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("   -> [OK] Semua tabel berhasil dibuat di Azure!")

    async with SrcSession() as src_session, TgtSession() as tgt_session:
        # 1. Migrate Categories
        print("3. Memindahkan data Categories...")
        categories = (await src_session.execute(select(Category))).scalars().all()
        migrated_cats = 0
        for cat in categories:
            existing = (
                await tgt_session.execute(select(Category).where(Category.name == cat.name))
            ).scalars().first()
            if not existing:
                tgt_session.add(
                    Category(
                        id=cat.id,
                        name=cat.name,
                        is_system=cat.is_system,
                        created_at=cat.created_at,
                    )
                )
                migrated_cats += 1
        await tgt_session.commit()
        print(f"   -> [OK] {migrated_cats} kategori baru dipindahkan (Total di Supabase: {len(categories)}).")

        # 2. Migrate LinkItems + Tags + GDriveFiles
        print("4. Memindahkan data LinkItems, Tags, dan GDriveFiles...")
        links = (await src_session.execute(select(LinkItem))).scalars().all()
        migrated_links = 0
        for item in links:
            existing_link = (
                await tgt_session.execute(select(LinkItem).where(LinkItem.url == item.url))
            ).scalars().first()
            if existing_link:
                continue

            new_item = LinkItem(
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
            tgt_session.add(new_item)
            await tgt_session.flush()

            for tag in item.tags:
                tgt_session.add(
                    LinkTag(
                        id=tag.id,
                        link_id=new_item.id,
                        tag_name=tag.tag_name,
                    )
                )

            for gfile in item.gdrive_files:
                tgt_session.add(
                    GDriveFile(
                        id=gfile.id,
                        link_id=new_item.id,
                        file_name=gfile.file_name,
                        mime_type=gfile.mime_type,
                        file_size_bytes=gfile.file_size_bytes,
                        web_view_link=gfile.web_view_link,
                    )
                )

            migrated_links += 1

        await tgt_session.commit()
        print(f"   -> [OK] {migrated_links} link beserta tags & file GDrive berhasil dipindahkan (Total di Supabase: {len(links)})!")

    await src_engine.dispose()
    await tgt_engine.dispose()
    print("\n=== MIGRASI SUPABASE -> MICROSOFT AZURE 100% SELESAI! ===")


if __name__ == "__main__":
    from app.config import settings

    print("==========================================================")
    print("  MIGRASI DATABASE LINKTRACK: SUPABASE -> MICROSOFT AZURE ")
    print("==========================================================")
    source_db = os.environ.get("SOURCE_DATABASE_URL") or settings.DATABASE_URL
    target_db = os.environ.get("AZURE_DATABASE_URL") or (sys.argv[1] if len(sys.argv) > 1 else "")

    if not target_db:
        print("\nCara menjalankan script migrasi ini:")
        print('  .\\.venv\\Scripts\\python.exe migrate_to_azure.py "postgresql+asyncpg://USER:PASSWORD@NAMA-SERVER.postgres.database.azure.com:5432/postgres?ssl=require"')
        sys.exit(1)

    asyncio.run(migrate(source_db, target_db))

