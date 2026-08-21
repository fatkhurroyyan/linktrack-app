import re
import httpx
from bs4 import BeautifulSoup
from typing import Optional, Any
from app.config import settings
from app.extractors.base import BaseExtractor, ExtractedContent

class GDriveExtractor(BaseExtractor):
    """
    Extractor for Google Drive files and folders.
    Supports both Google Drive API v3 (when API Key is configured) and public HTML metadata scraping fallback.
    """

    FOLDER_REGEX = re.compile(r"drive\.google\.com/drive/(?:u/\d+/)?folders/([a-zA-Z0-9_-]+)")
    FILE_REGEX = re.compile(r"drive\.google\.com/file/d/([a-zA-Z0-9_-]+)")
    OPEN_ID_REGEX = re.compile(r"drive\.google\.com/open\?id=([a-zA-Z0-9_-]+)")
    DOCS_REGEX = re.compile(r"docs\.google\.com/(document|spreadsheets|presentation)/d/([a-zA-Z0-9_-]+)")

    @classmethod
    def can_handle(cls, url: str) -> bool:
        return "drive.google.com" in url or "docs.google.com" in url

    def parse_resource_id(self, url: str) -> tuple[Optional[str], str]:
        """Returns (resource_id, resource_type: folder|file|doc|sheet|slides|unknown)"""
        if m := self.FOLDER_REGEX.search(url):
            return m.group(1), "folder"
        if m := self.FILE_REGEX.search(url):
            return m.group(1), "file"
        if m := self.OPEN_ID_REGEX.search(url):
            return m.group(1), "file"
        if m := self.DOCS_REGEX.search(url):
            doc_type = m.group(1)
            doc_id = m.group(2)
            type_map = {
                "document": "Google Doc",
                "spreadsheets": "Google Sheet",
                "presentation": "Google Slides",
            }
            return doc_id, type_map.get(doc_type, "document")
        return None, "unknown"

    async def extract(self, url: str) -> ExtractedContent:
        resource_id, resource_type = self.parse_resource_id(url)
        
        # If API key is available, attempt official Google Drive API
        if settings.GOOGLE_DRIVE_API_KEY and resource_id:
            try:
                api_content = await self._extract_via_api(url, resource_id, resource_type)
                if api_content:
                    return api_content
            except Exception:
                # Fallback to web scraping if API fails or quota exceeded
                pass

        # Fallback to public web scraping
        return await self._extract_via_scraping(url, resource_id, resource_type)

    async def _extract_via_api(self, url: str, resource_id: str, resource_type: str) -> Optional[ExtractedContent]:
        api_key = settings.GOOGLE_DRIVE_API_KEY
        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS) as client:
            # 1. Get Resource Metadata
            meta_url = f"https://www.googleapis.com/drive/v3/files/{resource_id}?fields=id,name,mimeType,size,description,modifiedTime&key={api_key}"
            resp = await client.get(meta_url)
            if resp.status_code != 200:
                return None
            
            data = resp.json()
            title = data.get("name", f"Google Drive {resource_type.title()}")
            mime_type = data.get("mimeType", "")
            description = data.get("description", "")
            size = int(data.get("size", 0)) if data.get("size") else None
            
            child_files = []
            item_count = None
            total_size = size

            # 2. If it's a folder, query children
            if mime_type == "application/vnd.google-apps.folder" or resource_type == "folder":
                list_url = f"https://www.googleapis.com/drive/v3/files?q='{resource_id}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,webViewLink)&pageSize=100&key={api_key}"
                list_resp = await client.get(list_url)
                if list_resp.status_code == 200:
                    files_data = list_resp.json().get("files", [])
                    item_count = len(files_data)
                    total_size = sum(int(f.get("size", 0)) for f in files_data if f.get("size"))
                    for f in files_data:
                        child_files.append({
                            "id": f.get("id"),
                            "file_name": f.get("name"),
                            "mime_type": f.get("mimeType"),
                            "file_size_bytes": int(f.get("size")) if f.get("size") else None,
                            "web_view_link": f.get("webViewLink")
                        })

            summary_context = f"Google Drive Resource: {title}\nTipe: {mime_type or resource_type}\nDeskripsi: {description}\n"
            if child_files:
                file_names = ", ".join([f["file_name"] for f in child_files[:20]])
                summary_context += f"Daftar File ({item_count} files): {file_names}"

            return ExtractedContent(
                url=url,
                platform="GDrive",
                title=f"Google Drive: {title}",
                original_description=description or f"Folder/Berkas Google Drive dengan {item_count or 1} item.",
                raw_text=summary_context,
                item_count=item_count,
                total_size_bytes=total_size,
                favicon_url="https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
                raw_metadata={
                    "resource_id": resource_id,
                    "mime_type": mime_type,
                    "is_folder": resource_type == "folder" or mime_type == "application/vnd.google-apps.folder",
                },
                child_files=child_files
            )

    async def _extract_via_scraping(self, url: str, resource_id: Optional[str], resource_type: str) -> ExtractedContent:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
        title = f"Google Drive {resource_type.title()}"
        description = "Tautan Google Drive"
        raw_text = f"Tautan Google Drive: {url}\nTipe perkiraan: {resource_type}\nID: {resource_id or 'N/A'}"

        try:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    
                    # Extract page title
                    page_title = soup.find("title")
                    if page_title and page_title.text.strip():
                        clean_title = page_title.text.strip().replace(" - Google Drive", "").replace(" - Google Docs", "").replace(" - Google Sheets", "")
                        if clean_title:
                            title = clean_title
                    
                    # Extract OpenGraph / meta tags
                    og_title = soup.find("meta", property="og:title")
                    if og_title and og_title.get("content"):
                        title = og_title["content"].replace(" - Google Drive", "")
                        
                    og_desc = soup.find("meta", property="og:description")
                    if og_desc and og_desc.get("content"):
                        description = og_desc["content"]
                        
                    meta_desc = soup.find("meta", attrs={"name": "description"})
                    if meta_desc and meta_desc.get("content") and not description:
                        description = meta_desc["content"]

                    raw_text = f"Nama Folder/Berkas: {title}\nDeskripsi: {description}\nTipe: {resource_type}\nURL: {url}"
        except Exception:
            pass

        return ExtractedContent(
            url=url,
            platform="GDrive",
            title=f"Google Drive: {title}" if not title.startswith("Google Drive") else title,
            original_description=description,
            raw_text=raw_text,
            item_count=None,
            total_size_bytes=None,
            favicon_url="https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png",
            raw_metadata={
                "resource_id": resource_id,
                "resource_type": resource_type,
                "scraped": True
            },
            child_files=[]
        )
