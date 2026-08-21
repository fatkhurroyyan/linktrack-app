import asyncio
import os
import sys

# Ensure UTF-8 output on Windows
sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database.session import init_db, AsyncSessionLocal
from app.extractors.github_extractor import GitHubExtractor
from app.extractors.web_scraper import WebScraper
from app.extractors.gdrive_extractor import GDriveExtractor
from app.services.orchestrator import link_orchestrator
from app.services.export_service import export_service
from app.models.link_item import LinkItem

async def run_tests():
    print("[1/5] Inisialisasi Database SQLite...")
    await init_db()
    print("[SUCCESS] Database & tabel berhasil diinisialisasi.")

    print("\n[2/5] Test GitHub Extractor (fastapi/fastapi)...")
    github_ext = GitHubExtractor()
    extracted_gh = await github_ext.extract("https://github.com/fastapi/fastapi")
    print(f"[SUCCESS] GitHub Extracted: {extracted_gh.title} | Lang: {extracted_gh.primary_language} | Stars: {extracted_gh.raw_metadata.get('stars')}")

    print("\n[3/5] Test Web Scraper (python.org)...")
    web_ext = WebScraper()
    extracted_web = await web_ext.extract("https://www.python.org")
    print(f"[SUCCESS] Web Extracted: {extracted_web.title[:60]}... | Favicon: {extracted_web.favicon_url}")

    print("\n[4/5] Test End-to-End Orchestrator Pipeline...")
    async with AsyncSessionLocal() as db:
        item = await link_orchestrator.process_link("https://github.com/fastapi/fastapi", db)
        print(f"[SUCCESS] Link Saved: ID={item.id} | Category={item.primary_category} | Subcategory={item.subcategory}")
        print(f"   Summary: {item.summary}")
        print(f"   Tags: {[t.tag_name for t in item.tags]}")

        # Add a second item
        item2 = await link_orchestrator.process_link("https://drive.google.com/drive/folders/12345sampleFolderID", db)
        print(f"[SUCCESS] GDrive Saved: Title={item2.title} | Category={item2.primary_category}")

    print("\n[5/5] Test Export Service (Excel, CSV, PDF)...")
    async with AsyncSessionLocal() as db:
        from sqlalchemy import select
        res = await db.execute(select(LinkItem))
        all_items = list(res.scalars().unique().all())
        
        excel_bytes = export_service.export_to_excel(all_items)
        print(f"[SUCCESS] Excel generated: {len(excel_bytes.getvalue())} bytes")
        
        csv_bytes = export_service.export_to_csv(all_items)
        print(f"[SUCCESS] CSV generated: {len(csv_bytes.getvalue())} bytes")
        
        pdf_bytes = export_service.export_to_pdf(all_items)
        print(f"[SUCCESS] PDF generated: {len(pdf_bytes.getvalue())} bytes")

    print("\n[ALL TESTS PASSED] SEMUA TEST BACKEND BERHASIL 100%!")

if __name__ == "__main__":
    asyncio.run(run_tests())
