from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from app.config import settings

def get_normalized_database_url(url: str) -> str:
    """
    Normalizes Supabase / PostgreSQL URLs for asyncpg if standard postgresql:// is provided.
    """
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url

db_url = get_normalized_database_url(settings.DATABASE_URL)
is_sqlite = db_url.startswith("sqlite")

# Engine options based on database type
engine_kwargs = {"echo": False}
if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    # PostgreSQL / Supabase pool configuration
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

async def init_db():
    async with engine.begin() as conn:
        if is_sqlite:
            # SQLite performance PRAGMAs
            await conn.exec_driver_sql("PRAGMA journal_mode=WAL;")
            await conn.exec_driver_sql("PRAGMA synchronous=NORMAL;")
        # Auto-create all tables (SQLite or Supabase PostgreSQL)
        await conn.run_sync(Base.metadata.create_all)

        # Auto-migrate secondary_category column if missing on existing link_items table
        try:
            if is_sqlite:
                table_info = await conn.exec_driver_sql("PRAGMA table_info(link_items);")
                columns = [row[1] for row in table_info.fetchall()]
                if "secondary_category" not in columns:
                    await conn.exec_driver_sql("ALTER TABLE link_items ADD COLUMN secondary_category VARCHAR(100);")
            else:
                await conn.exec_driver_sql("ALTER TABLE link_items ADD COLUMN IF NOT EXISTS secondary_category VARCHAR(100);")
        except Exception:
            pass

    # Seed default categories if empty
    from app.models.link_item import Category
    from sqlalchemy import select

    DEFAULT_CATEGORIES = [
        ("GDrive", True),
        ("GitHub", True),
        ("Frontend Development", False),
        ("Backend & API", False),
        ("AI & Machine Learning", False),
        ("Data & Research", False),
        ("Desain & Aset Grafis", False),
        ("DevOps & Cloud", False),
        ("E-book & Edukasi", False),
        ("Produktivitas & Tools", False),
    ]

    async with AsyncSessionLocal() as session:
        try:
            for cat_name, is_sys in DEFAULT_CATEGORIES:
                stmt = select(Category).where(Category.name == cat_name)
                res = await session.execute(stmt)
                if not res.scalars().first():
                    session.add(Category(name=cat_name, is_system=is_sys))
            await session.commit()
        except Exception:
            await session.rollback()
