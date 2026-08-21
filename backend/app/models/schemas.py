from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, Any

# Pydantic Schema for Gemini Structured Output
class AICategorizationSchema(BaseModel):
    title: str = Field(description="Judul bersih, deskriptif, dan representatif dari resource")
    platform: str = Field(description="Platform resource: Google Drive | GitHub | Web")
    primary_category: str = Field(
        description="Kategori utama, contoh: Frontend Development, Backend & API, AI & Machine Learning, Data & Research, Desain & Aset Grafis, DevOps & Cloud, E-book & Edukasi, Produktivitas & Tools"
    )
    subcategory: str = Field(
        description="Sub-kategori atau spesifik use-case, contoh: UI Component Library, Fine-Tuning Pipeline, Dataset Riset, 3D Icon Asset, REST API Template"
    )
    summary: str = Field(
        description="1-2 kalimat ringkas dan padat dalam Bahasa Indonesia yang menjelaskan apa isi/kegunaan resource ini dan mengapa bermanfaat"
    )
    tags: list[str] = Field(
        description="3-6 kata kunci spesifik, huruf kecil semua, tanpa spasi (gunakan tanda hubung bila multi-kata)"
    )
    primary_language: Optional[str] = Field(
        default=None,
        description="Bahasa pemrograman utama bila repositori kode (misal TypeScript, Python, Go, Rust), null bila bukan kode"
    )

# Request Schemas
class LinkProcessRequest(BaseModel):
    url: str = Field(..., description="URL tautan (Google Drive, GitHub, atau Web umum)")

class LinkBatchProcessRequest(BaseModel):
    urls: list[str] = Field(..., description="Daftar URL yang akan diproses secara batch")

class LinkUpdateRequest(BaseModel):
    title: Optional[str] = None
    primary_category: Optional[str] = None
    subcategory: Optional[str] = None
    summary: Optional[str] = None
    tags: Optional[list[str]] = None

# Response DTOs
class GDriveFileDTO(BaseModel):
    id: str
    file_name: str
    mime_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    web_view_link: Optional[str] = None

    class Config:
        from_attributes = True

class LinkItemResponse(BaseModel):
    id: str
    url: str
    platform: str
    title: str
    primary_category: str
    subcategory: Optional[str] = None
    summary: Optional[str] = None
    original_description: Optional[str] = None
    primary_language: Optional[str] = None
    item_count: Optional[int] = None
    total_size_bytes: Optional[int] = None
    favicon_url: Optional[str] = None
    raw_metadata: Optional[dict[str, Any]] = None
    tags: list[str] = []
    gdrive_files: list[GDriveFileDTO] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LinkListResponse(BaseModel):
    items: list[LinkItemResponse]
    total: int
    page: int
    limit: int
    total_pages: int

class BatchProcessError(BaseModel):
    url: str
    error: str

class BatchProcessResponse(BaseModel):
    total_submitted: int
    successful: int
    failed: int
    items: list[LinkItemResponse]
    errors: list[BatchProcessError]

class AnalyticsStatsResponse(BaseModel):
    total_links: int
    platform_counts: dict[str, int]
    top_categories: list[dict[str, Any]]
    top_tags: list[dict[str, Any]]
    recent_count_7d: int
