from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, desc
from sqlalchemy.orm import selectinload
from typing import Optional
from datetime import datetime

from app.database.session import get_db
from app.models.link_item import LinkItem, LinkTag
from app.services.export_service import export_service

router = APIRouter(prefix="/export", tags=["Smart Document Export"])

async def get_filtered_items(
    db: AsyncSession,
    query: Optional[str] = None,
    platform: Optional[str] = None,
    category: Optional[str] = None,
    tag: Optional[str] = None,
) -> list[LinkItem]:
    stmt = select(LinkItem).options(selectinload(LinkItem.tags), selectinload(LinkItem.gdrive_files))

    if platform and platform.lower() not in ("all", "semua", ""):
        if "drive" in platform.lower() or "gdrive" in platform.lower():
            stmt = stmt.where(LinkItem.platform.ilike("%drive%"))
        elif "github" in platform.lower():
            stmt = stmt.where(LinkItem.platform.ilike("%github%"))
        else:
            stmt = stmt.where(LinkItem.platform.ilike(f"%{platform}%"))

    if category and category.lower() not in ("all", "semua", ""):
        stmt = stmt.where(
            or_(
                LinkItem.primary_category == category,
                LinkItem.secondary_category == category
            )
        )

    if tag and tag.strip():
        stmt = stmt.join(LinkItem.tags).where(LinkTag.tag_name == tag.strip().lower())

    if query and query.strip():
        search_pattern = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                LinkItem.title.ilike(search_pattern),
                LinkItem.summary.ilike(search_pattern),
                LinkItem.subcategory.ilike(search_pattern),
                LinkItem.url.ilike(search_pattern)
            )
        )

    stmt = stmt.order_by(desc(LinkItem.created_at))
    res = await db.execute(stmt)
    return list(res.scalars().unique().all())

@router.get("/excel")
async def export_excel(
    query: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Export curated links into an interactive Excel spreadsheet (.xlsx) with active hyperlinks.
    """
    items = await get_filtered_items(db, query, platform, category, tag)
    file_bytes = export_service.export_to_excel(items)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"LinkSense_Export_{timestamp}.xlsx"

    return Response(
        content=file_bytes.getvalue(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/csv")
async def export_csv(
    query: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Export curated links into a UTF-8 BOM CSV file.
    """
    items = await get_filtered_items(db, query, platform, category, tag)
    file_bytes = export_service.export_to_csv(items)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"LinkSense_Export_{timestamp}.csv"

    return Response(
        content=file_bytes.getvalue(),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/pdf")
async def export_pdf(
    query: Optional[str] = Query(None),
    platform: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    tag: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Export curated links into a visual printable PDF catalog.
    """
    items = await get_filtered_items(db, query, platform, category, tag)
    file_bytes = export_service.export_to_pdf(items)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"LinkSense_Catalog_{timestamp}.pdf"

    return Response(
        content=file_bytes.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
