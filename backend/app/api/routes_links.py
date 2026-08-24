from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func, desc, asc
from sqlalchemy.orm import selectinload
from typing import Optional

from app.database.session import get_db
from app.models.link_item import LinkItem, LinkTag
from app.models.schemas import (
    LinkProcessRequest,
    LinkBatchProcessRequest,
    LinkUpdateRequest,
    LinkItemResponse,
    LinkListResponse,
    BatchProcessResponse,
    BatchProcessError,
    GDriveFileDTO,
)
from app.services.orchestrator import link_orchestrator

router = APIRouter(prefix="/links", tags=["Links Management"])

def format_link_response(item: LinkItem) -> LinkItemResponse:
    tags = [t.tag_name for t in item.tags] if item.tags else []
    gdrive_files = [
        GDriveFileDTO(
            id=f.id,
            file_name=f.file_name,
            mime_type=f.mime_type,
            file_size_bytes=f.file_size_bytes,
            web_view_link=f.web_view_link,
        )
        for f in (item.gdrive_files or [])
    ]
    return LinkItemResponse(
        id=item.id,
        url=item.url,
        platform=item.platform,
        title=item.title,
        primary_category=item.primary_category,
        secondary_category=item.secondary_category,
        categories=item.categories,
        subcategory=item.subcategory,
        summary=item.summary,
        original_description=item.original_description,
        primary_language=item.primary_language,
        item_count=item.item_count,
        total_size_bytes=item.total_size_bytes,
        favicon_url=item.favicon_url,
        raw_metadata=item.raw_metadata or {},
        tags=tags,
        gdrive_files=gdrive_files,
        created_at=item.created_at,
        updated_at=item.updated_at,
    )

@router.post("/process", response_model=LinkItemResponse, status_code=status.HTTP_201_CREATED)
async def process_single_link(
    payload: LinkProcessRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Ingest, extract metadata, classify with Gemini AI, and save link item.
    """
    try:
        item = await link_orchestrator.process_link(payload.url, db)
        return format_link_response(item)
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Gagal memproses link: {str(e)}")

@router.post("/batch", response_model=BatchProcessResponse)
async def process_batch_links(
    payload: LinkBatchProcessRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Process multiple URLs in batch mode.
    """
    items, errors = await link_orchestrator.process_batch(payload.urls, db)
    return BatchProcessResponse(
        total_submitted=len(payload.urls),
        successful=len(items),
        failed=len(errors),
        items=[format_link_response(it) for it in items],
        errors=[BatchProcessError(url=err["url"], error=err["error"]) for err in errors]
    )

@router.get("", response_model=LinkListResponse)
async def list_links(
    query: Optional[str] = Query(None, description="Search keyword in title, summary, or tags"),
    platform: Optional[str] = Query(None, description="Filter platform: All, Google Drive, GitHub, Web"),
    category: Optional[str] = Query(None, description="Filter by primary or secondary category"),
    tag: Optional[str] = Query(None, description="Filter by tag"),
    sort_by: str = Query("created_at", description="Field to sort by: created_at, title, platform"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LinkItem).options(selectinload(LinkItem.tags), selectinload(LinkItem.gdrive_files))

    # 1. Platform Filter
    if platform and platform.lower() not in ("all", "semua", ""):
        if "drive" in platform.lower() or "gdrive" in platform.lower():
            stmt = stmt.where(LinkItem.platform.ilike("%drive%"))
        elif "github" in platform.lower():
            stmt = stmt.where(LinkItem.platform.ilike("%github%"))
        else:
            stmt = stmt.where(LinkItem.platform.ilike(f"%{platform}%"))

    # 2. Category Filter (Check both primary and secondary category)
    if category and category.lower() not in ("all", "semua", ""):
        stmt = stmt.where(
            or_(
                LinkItem.primary_category == category,
                LinkItem.secondary_category == category
            )
        )

    # 3. Tag Filter
    if tag and tag.strip():
        stmt = stmt.join(LinkItem.tags).where(LinkTag.tag_name == tag.strip().lower())

    # 4. Search Query
    if query and query.strip():
        search_pattern = f"%{query.strip()}%"
        stmt = stmt.where(
            or_(
                LinkItem.title.ilike(search_pattern),
                LinkItem.summary.ilike(search_pattern),
                LinkItem.subcategory.ilike(search_pattern),
                LinkItem.primary_language.ilike(search_pattern),
                LinkItem.url.ilike(search_pattern)
            )
        )

    # Total Count
    count_stmt = select(func.count(func.distinct(LinkItem.id)))
    # Apply the same filters for count
    if platform and platform.lower() not in ("all", "semua", ""):
        if "drive" in platform.lower() or "gdrive" in platform.lower():
            count_stmt = count_stmt.where(LinkItem.platform.ilike("%drive%"))
        elif "github" in platform.lower():
            count_stmt = count_stmt.where(LinkItem.platform.ilike("%github%"))
        else:
            count_stmt = count_stmt.where(LinkItem.platform.ilike(f"%{platform}%"))
    if category and category.lower() not in ("all", "semua", ""):
        count_stmt = count_stmt.where(
            or_(
                LinkItem.primary_category == category,
                LinkItem.secondary_category == category
            )
        )
    if tag and tag.strip():
        count_stmt = count_stmt.join(LinkItem.tags).where(LinkTag.tag_name == tag.strip().lower())
    if query and query.strip():
        search_pattern = f"%{query.strip()}%"
        count_stmt = count_stmt.where(
            or_(
                LinkItem.title.ilike(search_pattern),
                LinkItem.summary.ilike(search_pattern),
                LinkItem.subcategory.ilike(search_pattern),
                LinkItem.primary_language.ilike(search_pattern),
                LinkItem.url.ilike(search_pattern)
            )
        )

    total_res = await db.execute(count_stmt)
    total_count = total_res.scalar_one()

    # 5. Sorting
    sort_column = LinkItem.created_at
    if sort_by == "title":
        sort_column = LinkItem.title
    elif sort_by == "platform":
        sort_column = LinkItem.platform

    if sort_order.lower() == "asc":
        stmt = stmt.order_by(asc(sort_column))
    else:
        stmt = stmt.order_by(desc(sort_column))

    # 6. Pagination
    offset = (page - 1) * limit
    stmt = stmt.offset(offset).limit(limit)

    res = await db.execute(stmt)
    items = res.scalars().unique().all()

    total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1

    return LinkListResponse(
        items=[format_link_response(item) for item in items],
        total=total_count,
        page=page,
        limit=limit,
        total_pages=total_pages
    )

@router.get("/{link_id}", response_model=LinkItemResponse)
async def get_link_detail(
    link_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LinkItem).where(LinkItem.id == link_id).options(selectinload(LinkItem.tags), selectinload(LinkItem.gdrive_files))
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item tautan tidak ditemukan.")
    return format_link_response(item)

@router.put("/{link_id}", response_model=LinkItemResponse)
async def update_link(
    link_id: str,
    payload: LinkUpdateRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LinkItem).where(LinkItem.id == link_id).options(selectinload(LinkItem.tags), selectinload(LinkItem.gdrive_files))
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item tautan tidak ditemukan.")

    is_gdrive = "drive" in item.platform.lower() or "drive.google.com" in item.url
    is_github = "github" in item.platform.lower() or "github.com" in item.url

    if payload.title is not None:
        item.title = payload.title

    # Handle Category Updates (Array categories or primary/secondary fields)
    if payload.categories is not None:
        # Validate max 2 categories
        clean_cats = [c.strip() for c in payload.categories if c and c.strip()]
        if is_gdrive:
            item.primary_category = "GDrive"
            sec = next((c for c in clean_cats if c != "GDrive"), None)
            item.secondary_category = sec
        elif is_github:
            item.primary_category = "GitHub"
            sec = next((c for c in clean_cats if c != "GitHub"), None)
            item.secondary_category = sec
        else:
            if len(clean_cats) > 0:
                item.primary_category = clean_cats[0]
            if len(clean_cats) > 1:
                item.secondary_category = clean_cats[1]
            elif len(clean_cats) == 1:
                item.secondary_category = None
    else:
        if payload.primary_category is not None:
            if is_gdrive:
                item.primary_category = "GDrive"
            elif is_github:
                item.primary_category = "GitHub"
            else:
                item.primary_category = payload.primary_category
        if payload.secondary_category is not None:
            # Check if secondary is empty string -> set None
            item.secondary_category = payload.secondary_category.strip() if payload.secondary_category.strip() else None

    if payload.subcategory is not None:
        item.subcategory = payload.subcategory
    if payload.summary is not None:
        item.summary = payload.summary
    if payload.tags is not None:
        item.tags.clear()
        for tag_text in payload.tags:
            item.tags.append(LinkTag(tag_name=tag_text.strip().lower()))

    await db.commit()
    await db.refresh(item)
    return format_link_response(item)

@router.delete("/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_link(
    link_id: str,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(LinkItem).where(LinkItem.id == link_id)
    res = await db.execute(stmt)
    item = res.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item tautan tidak ditemukan.")

    await db.delete(item)
    await db.commit()
    return None
