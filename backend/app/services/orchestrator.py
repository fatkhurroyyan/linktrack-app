import asyncio
import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.extractors.base import SecurityValidator, ExtractedContent
from app.extractors.gdrive_extractor import GDriveExtractor
from app.extractors.github_extractor import GitHubExtractor
from app.extractors.web_scraper import WebScraper
from app.services.ai_service import ai_service
from app.models.link_item import LinkItem, LinkTag, GDriveFile

logger = logging.getLogger(__name__)

class LinkOrchestrator:
    """
    Coordinates URL validation, platform extraction, AI categorization, and database persistence.
    """

    def __init__(self):
        self.gdrive_extractor = GDriveExtractor()
        self.github_extractor = GitHubExtractor()
        self.web_scraper = WebScraper()

    def select_extractor(self, url: str):
        if GDriveExtractor.can_handle(url):
            return self.gdrive_extractor
        elif GitHubExtractor.can_handle(url):
            return self.github_extractor
        else:
            return self.web_scraper

    async def process_link(self, url: str, db: AsyncSession) -> LinkItem:
        # 1. Validate URL & Check SSRF
        clean_url = SecurityValidator.validate_url(url)

        # 2. Check if URL already exists in database with preloaded relationships
        stmt = (
            select(LinkItem)
            .where(LinkItem.url == clean_url)
            .options(selectinload(LinkItem.tags), selectinload(LinkItem.gdrive_files))
        )
        res = await db.execute(stmt)
        existing_item = res.scalars().first()

        # 3. Extract Content from URL
        extractor = self.select_extractor(clean_url)
        extracted: ExtractedContent = await extractor.extract(clean_url)

        # 4. AI Categorization & Taxonomy
        ai_res = await ai_service.categorize_and_summarize(extracted)

        # Construct Tag Models
        tags_objs = [
            LinkTag(tag_name=tag_text.strip().lower())
            for tag_text in ai_res.tags
            if tag_text.strip()
        ]

        # Construct GDrive File Models
        gdrive_file_objs = [
            GDriveFile(
                file_name=f["file_name"],
                mime_type=f.get("mime_type"),
                file_size_bytes=f.get("file_size_bytes"),
                web_view_link=f.get("web_view_link"),
            )
            for f in extracted.child_files
        ]

        # 5. Save or Update to Database
        if existing_item:
            item = existing_item
            item.platform = ai_res.platform
            item.title = ai_res.title or extracted.title
            item.primary_category = ai_res.primary_category
            item.subcategory = ai_res.subcategory
            item.summary = ai_res.summary
            item.original_description = extracted.original_description
            item.primary_language = ai_res.primary_language or extracted.primary_language
            item.item_count = extracted.item_count
            item.total_size_bytes = extracted.total_size_bytes
            item.favicon_url = extracted.favicon_url
            item.raw_metadata = extracted.raw_metadata
            item.tags = tags_objs
            item.gdrive_files = gdrive_file_objs
        else:
            item = LinkItem(
                url=clean_url,
                platform=ai_res.platform,
                title=ai_res.title or extracted.title,
                primary_category=ai_res.primary_category,
                subcategory=ai_res.subcategory,
                summary=ai_res.summary,
                original_description=extracted.original_description,
                primary_language=ai_res.primary_language or extracted.primary_language,
                item_count=extracted.item_count,
                total_size_bytes=extracted.total_size_bytes,
                favicon_url=extracted.favicon_url,
                raw_metadata=extracted.raw_metadata,
                tags=tags_objs,
                gdrive_files=gdrive_file_objs,
            )
            db.add(item)

        await db.commit()
        await db.refresh(item)
        return item

    async def process_batch(self, urls: list[str], db: AsyncSession) -> tuple[list[LinkItem], list[dict]]:
        successful_items = []
        errors = []

        unique_urls = list(dict.fromkeys([u.strip() for u in urls if u.strip()]))

        for url in unique_urls:
            try:
                item = await self.process_link(url, db)
                successful_items.append(item)
            except Exception as e:
                logger.error(f"Error processing batch URL '{url}': {e}")
                errors.append({"url": url, "error": str(e)})

        return successful_items, errors

link_orchestrator = LinkOrchestrator()
