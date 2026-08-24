from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, delete, update
from typing import Optional

from app.database.session import get_db
from app.models.link_item import Category, LinkItem
from app.models.schemas import CategoryCreate, CategoryResponse, CategoryUsageCheckResponse

router = APIRouter(prefix="/categories", tags=["Categories Management"])

@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db)):
    """
    Retrieve all categories along with their real-time usage count across links.
    """
    stmt = select(Category).order_by(Category.is_system.desc(), Category.name.asc())
    res = await db.execute(stmt)
    categories = res.scalars().all()

    # Calculate usage count for each category
    result = []
    for cat in categories:
        count_stmt = select(func.count(LinkItem.id)).where(
            or_(
                LinkItem.primary_category == cat.name,
                LinkItem.secondary_category == cat.name
            )
        )
        count_res = await db.execute(count_stmt)
        usage = count_res.scalar_one()

        result.append(
            CategoryResponse(
                id=cat.id,
                name=cat.name,
                is_system=cat.is_system,
                usage_count=usage,
                created_at=cat.created_at,
            )
        )
    return result

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new category. Name must be unique and non-empty.
    """
    cat_name = payload.name.strip()
    if not cat_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nama kategori tidak boleh kosong."
        )

    # Check if category already exists (case-insensitive)
    stmt = select(Category).where(func.lower(Category.name) == cat_name.lower())
    res = await db.execute(stmt)
    if res.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Kategori '{cat_name}' sudah ada."
        )

    new_cat = Category(name=cat_name, is_system=False)
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)

    return CategoryResponse(
        id=new_cat.id,
        name=new_cat.name,
        is_system=new_cat.is_system,
        usage_count=0,
        created_at=new_cat.created_at,
    )

@router.get("/{category_id}/check", response_model=CategoryUsageCheckResponse)
async def check_category_usage(
    category_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Check if a category can be safely deleted or if it's currently assigned to links.
    """
    stmt = select(Category).where(Category.id == category_id)
    res = await db.execute(stmt)
    cat = res.scalars().first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kategori tidak ditemukan.")

    if cat.is_system:
        return CategoryUsageCheckResponse(
            category_id=cat.id,
            name=cat.name,
            usage_count=0,
            can_delete=False,
            message="Kategori sistem (GDrive / GitHub) tidak dapat dihapus."
        )

    count_stmt = select(func.count(LinkItem.id)).where(
        or_(
            LinkItem.primary_category == cat.name,
            LinkItem.secondary_category == cat.name
        )
    )
    count_res = await db.execute(count_stmt)
    usage = count_res.scalar_one()

    return CategoryUsageCheckResponse(
        category_id=cat.id,
        name=cat.name,
        usage_count=usage,
        can_delete=True,
        message=f"Kategori '{cat.name}' digunakan oleh {usage} tautan." if usage > 0 else "Kategori siap dihapus."
    )

@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
async def delete_category(
    category_id: str,
    force: bool = Query(False, description="Paksa hapus meskipun ada link yang menggunakannya"),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a category. If in use and force is False, returns a warning (409 Conflict).
    If force is True, removes references from links and deletes the category.
    """
    stmt = select(Category).where(Category.id == category_id)
    res = await db.execute(stmt)
    cat = res.scalars().first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Kategori tidak ditemukan.")

    if cat.is_system:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kategori sistem mutlak (GDrive / GitHub) tidak dapat dihapus."
        )

    # Check usage count
    count_stmt = select(func.count(LinkItem.id)).where(
        or_(
            LinkItem.primary_category == cat.name,
            LinkItem.secondary_category == cat.name
        )
    )
    count_res = await db.execute(count_stmt)
    usage = count_res.scalar_one()

    if usage > 0 and not force:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": f"Kategori '{cat.name}' sedang digunakan oleh {usage} tautan.",
                "usage_count": usage,
                "category_id": cat.id,
                "category_name": cat.name
            }
        )

    # If force is true and usage > 0, clean up references
    if usage > 0 and force:
        # For secondary category, set to None
        await db.execute(
            update(LinkItem)
            .where(LinkItem.secondary_category == cat.name)
            .values(secondary_category=None)
        )

        # For primary category, replace with secondary if exists, or fallback based on platform
        primary_links_stmt = select(LinkItem).where(LinkItem.primary_category == cat.name)
        primary_links_res = await db.execute(primary_links_stmt)
        primary_links = primary_links_res.scalars().all()

        for link in primary_links:
            if link.secondary_category and link.secondary_category != cat.name:
                link.primary_category = link.secondary_category
                link.secondary_category = None
            elif "drive" in link.platform.lower():
                link.primary_category = "GDrive"
            elif "github" in link.platform.lower():
                link.primary_category = "GitHub"
            else:
                link.primary_category = "Produktivitas & Tools"

    # Delete category
    await db.delete(cat)
    await db.commit()

    return {"message": f"Kategori '{cat.name}' berhasil dihapus.", "affected_links": usage}
