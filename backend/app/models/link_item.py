import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, BigInteger, Integer, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database.session import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def get_utc_now() -> datetime:
    return datetime.now(timezone.utc)

class Category(Base):
    __tablename__ = "categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), unique=True, index=True, nullable=False)
    is_system = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_utc_now)

class LinkItem(Base):
    __tablename__ = "link_items"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    url = Column(String(2048), unique=True, index=True, nullable=False)
    platform = Column(String(50), index=True, nullable=False)  # Google Drive, GitHub, Web
    title = Column(String(500), nullable=False)
    primary_category = Column(String(100), index=True, nullable=False)
    secondary_category = Column(String(100), index=True, nullable=True)
    subcategory = Column(String(100), nullable=True)
    summary = Column(Text, nullable=True)
    original_description = Column(Text, nullable=True)
    primary_language = Column(String(50), nullable=True)
    item_count = Column(Integer, nullable=True)
    total_size_bytes = Column(BigInteger, nullable=True)
    favicon_url = Column(String(1024), nullable=True)
    raw_metadata = Column(JSON, nullable=True, default=dict)
    
    created_at = Column(DateTime(timezone=True), default=get_utc_now, index=True)
    updated_at = Column(DateTime(timezone=True), default=get_utc_now, onupdate=get_utc_now)

    # Relationships with eager selectin loading
    tags = relationship("LinkTag", back_populates="link", cascade="all, delete-orphan", lazy="selectin")
    gdrive_files = relationship("GDriveFile", back_populates="link", cascade="all, delete-orphan", lazy="selectin")

    @property
    def categories(self) -> list[str]:
        cats = []
        if self.primary_category and self.primary_category.strip():
            cats.append(self.primary_category.strip())
        if self.secondary_category and self.secondary_category.strip() and self.secondary_category.strip() not in cats:
            cats.append(self.secondary_category.strip())
        return cats[:2]

class LinkTag(Base):
    __tablename__ = "link_tags"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    link_id = Column(String(36), ForeignKey("link_items.id", ondelete="CASCADE"), index=True, nullable=False)
    tag_name = Column(String(100), index=True, nullable=False)

    link = relationship("LinkItem", back_populates="tags")

class GDriveFile(Base):
    __tablename__ = "gdrive_files"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    link_id = Column(String(36), ForeignKey("link_items.id", ondelete="CASCADE"), index=True, nullable=False)
    file_name = Column(String(500), nullable=False)
    mime_type = Column(String(100), nullable=True)
    file_size_bytes = Column(BigInteger, nullable=True)
    web_view_link = Column(String(2048), nullable=True)

    link = relationship("LinkItem", back_populates="gdrive_files")
