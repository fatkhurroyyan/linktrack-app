import json
import re
import logging
from typing import Optional
from google import genai
from google.genai import types
from app.config import settings
from app.extractors.base import ExtractedContent
from app.models.schemas import AICategorizationSchema

logger = logging.getLogger(__name__)

class AIService:
    """
    AI Categorization & Summarization Service powered by Google Gemini API.
    Uses official `google-genai` SDK with Structured Outputs.
    """

    def __init__(self):
        self._client: Optional[genai.Client] = None
        if settings.GEMINI_API_KEY:
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)

    def _get_client(self) -> Optional[genai.Client]:
        if not self._client and settings.GEMINI_API_KEY:
            self._client = genai.Client(api_key=settings.GEMINI_API_KEY)
        return self._client

    async def categorize_and_summarize(self, content: ExtractedContent) -> AICategorizationSchema:
        client = self._get_client()
        
        # If Gemini API Key is configured, use Gemini LLM
        if client:
            try:
                return await self._call_gemini(client, content)
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to heuristic categorization: {e}")

        # Intelligent Heuristic Fallback (when API key is not set or network fails)
        return self._heuristic_categorize(content)

    async def _call_gemini(self, client: genai.Client, content: ExtractedContent) -> AICategorizationSchema:
        system_instruction = (
            "Anda adalah AI Knowledge Architect dan Resource Curator profesional.\n"
            "Tugas Anda adalah mengklasifikasikan dan meringkas tautan digital (Google Drive, GitHub, atau Web umum) "
            "berdasarkan data yang diekstrak.\n\n"
            "Aturan Taksonomi:\n"
            "1. title: Judul bersih dan informatif.\n"
            "2. platform: Harus salah satu dari 'Google Drive', 'GitHub', atau 'Web'.\n"
            "3. primary_category: Pilih salah satu kategori utama yang paling tepat, seperti: "
            "'Frontend Development', 'Backend & API', 'AI & Machine Learning', 'Data & Research', "
            "'Desain & Aset Grafis', 'DevOps & Cloud', 'E-book & Edukasi', 'Produktivitas & Tools', "
            "'Security & Cyber', 'Mobile Development', atau 'Artikel & Blog'.\n"
            "4. subcategory: Tentukan spesifik use-case (misal: 'UI Component Library', 'Dataset CSV', 'REST API Template', '3D Model', 'Tutorial Lengkap').\n"
            "5. summary: Buat 1-2 kalimat padat, informatif, dan jelas dalam Bahasa Indonesia tentang fungsi utama resource ini.\n"
            "6. tags: 3-6 tag kata kunci relevan, huruf kecil semua, tanpa spasi (gunakan tanda minus '-' jika multi-kata).\n"
            "7. primary_language: Bahasa pemrograman utama jika repositori kode, atau null jika bukan."
        )

        prompt = (
            f"Tolong klasifikasikan dan ringkas resource berikut:\n\n"
            f"URL: {content.url}\n"
            f"Platform Asal: {content.platform}\n"
            f"Judul Awal: {content.title}\n"
            f"Deskripsi Asal: {content.original_description}\n"
            f"Bahasa Terdeteksi: {content.primary_language or 'N/A'}\n"
            f"Jumlah Item (bila folder): {content.item_count or 'N/A'}\n\n"
            f"Konten Terekstrak:\n{content.raw_text[:6000]}"
        )

        try:
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_mime_type="application/json",
                    response_schema=AICategorizationSchema,
                    temperature=0.2,
                ),
            )
            
            # Parse structured JSON response
            data = json.loads(response.text)
            return AICategorizationSchema(**data)
        except Exception as e:
            # Fallback to secondary model if primary fails
            if settings.GEMINI_FALLBACK_MODEL and settings.GEMINI_FALLBACK_MODEL != settings.GEMINI_MODEL:
                response = client.models.generate_content(
                    model=settings.GEMINI_FALLBACK_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=system_instruction,
                        response_mime_type="application/json",
                        response_schema=AICategorizationSchema,
                        temperature=0.2,
                    ),
                )
                data = json.loads(response.text)
                return AICategorizationSchema(**data)
            raise e

    def _heuristic_categorize(self, content: ExtractedContent) -> AICategorizationSchema:
        """Heuristic rule-based taxonomy fallback when LLM API is unavailable."""
        text = f"{content.title} {content.original_description} {content.raw_text}".lower()
        
        platform_name = "Web"
        if content.platform == "GDrive":
            platform_name = "Google Drive"
        elif content.platform == "GitHub":
            platform_name = "GitHub"

        # Categorization heuristics
        primary_category = "Produktivitas & Tools"
        subcategory = "Resource Web"
        tags = ["link", "resource"]

        if content.platform == "GitHub":
            if any(k in text for k in ["react", "vue", "svelte", "tailwind", "ui", "component", "css", "frontend", "html"]):
                primary_category = "Frontend Development"
                subcategory = "UI Component Library"
                tags.extend(["frontend", "ui", "web-dev"])
            elif any(k in text for k in ["ai", "llm", "gpt", "model", "machine learning", "deep learning", "pytorch", "tensorflow", "gemini"]):
                primary_category = "AI & Machine Learning"
                subcategory = "AI Framework & Tooling"
                tags.extend(["ai", "machine-learning", "llm"])
            elif any(k in text for k in ["api", "backend", "fastapi", "django", "express", "server", "database", "postgres", "sql"]):
                primary_category = "Backend & API"
                subcategory = "Backend Service & Template"
                tags.extend(["backend", "api", "database"])
            elif any(k in text for k in ["docker", "kubernetes", "ci/cd", "devops", "cloud", "aws", "terraform"]):
                primary_category = "DevOps & Cloud"
                subcategory = "Infrastructure as Code"
                tags.extend(["devops", "cloud", "infrastructure"])
            else:
                primary_category = "Software Development"
                subcategory = "Code Repository"
                tags.extend(["github", "open-source"])

            if content.primary_language:
                tags.append(content.primary_language.lower())

        elif content.platform == "GDrive":
            if any(k in text for k in ["dataset", "data", "csv", "xlsx", "survey", "analisis"]):
                primary_category = "Data & Research"
                subcategory = "Dataset & Spreadsheet"
                tags.extend(["dataset", "data", "gdrive"])
            elif any(k in text for k in ["buku", "ebook", "modul", "materi", "kuliah", "skripsi", "jurnal"]):
                primary_category = "E-book & Edukasi"
                subcategory = "Materi Pembelajaran & Dokumen"
                tags.extend(["edukasi", "dokumen", "materi"])
            elif any(k in text for k in ["desain", "aset", "icon", "vector", "foto", "video", "asset", "3d"]):
                primary_category = "Desain & Aset Grafis"
                subcategory = "Asset Koleksi Desain"
                tags.extend(["desain", "media", "aset"])
            else:
                primary_category = "Dokumen & Arsip"
                subcategory = "Google Drive Folder"
                tags.extend(["gdrive", "arsip", "folder"])

        else: # Web
            if any(k in text for k in ["docs", "documentation", "guide", "tutorial", "learn"]):
                primary_category = "E-book & Edukasi"
                subcategory = "Dokumentasi Resmi"
                tags.extend(["docs", "tutorial", "guide"])
            elif any(k in text for k in ["ai", "prompt", "chatgpt", "gemini", "agent"]):
                primary_category = "AI & Machine Learning"
                subcategory = "AI Web Platform"
                tags.extend(["ai", "tools", "web"])
            else:
                primary_category = "Artikel & Blog"
                subcategory = "Portal Informasi"
                tags.extend(["web", "article"])

        summary = (
            content.original_description[:200]
            if content.original_description
            else f"Resource tautan {platform_name} mengenai {content.title}."
        )

        return AICategorizationSchema(
            title=content.title[:150] if content.title else f"{platform_name} Resource",
            platform=platform_name,
            primary_category=primary_category,
            subcategory=subcategory,
            summary=summary,
            tags=list(dict.fromkeys(tags))[:6],
            primary_language=content.primary_language,
        )

ai_service = AIService()
