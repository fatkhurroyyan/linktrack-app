import urllib.parse
import httpx
from bs4 import BeautifulSoup
from app.config import settings
from app.extractors.base import BaseExtractor, ExtractedContent

class WebScraper(BaseExtractor):
    """
    Universal Web Scraper & Readability Extractor.
    Extracts page titles, meta descriptions, OpenGraph tags, favicons, and main body text.
    """

    async def extract(self, url: str) -> ExtractedContent:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        }

        parsed_url = urllib.parse.urlparse(url)
        domain = parsed_url.netloc or "web"
        fallback_favicon = f"https://www.google.com/s2/favicons?domain={domain}&sz=64"

        try:
            async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                
                if resp.status_code >= 400:
                    return ExtractedContent(
                        url=url,
                        platform="Web",
                        title=f"Web: {domain}",
                        original_description=f"Halaman web dari {domain} (HTTP {resp.status_code})",
                        raw_text=f"URL: {url}\nDomain: {domain}\nStatus: HTTP {resp.status_code}",
                        favicon_url=fallback_favicon
                    )

                html = resp.text
                soup = BeautifulSoup(html, "html.parser")

                # 1. Extract Title
                title = ""
                if og_title := soup.find("meta", property="og:title"):
                    title = og_title.get("content", "").strip()
                if not title and (tw_title := soup.find("meta", attrs={"name": "twitter:title"})):
                    title = tw_title.get("content", "").strip()
                if not title and soup.title and soup.title.string:
                    title = soup.title.string.strip()
                if not title and (h1 := soup.find("h1")):
                    title = h1.get_text(strip=True)
                if not title:
                    title = f"Web: {domain}"

                # 2. Extract Description
                description = ""
                if og_desc := soup.find("meta", property="og:description"):
                    description = og_desc.get("content", "").strip()
                if not description and (meta_desc := soup.find("meta", attrs={"name": "description"})):
                    description = meta_desc.get("content", "").strip()
                if not description and (tw_desc := soup.find("meta", attrs={"name": "twitter:description"})):
                    description = tw_desc.get("content", "").strip()

                # 3. Extract Favicon
                favicon_url = fallback_favicon
                icon_link = soup.find("link", rel=lambda x: x and "icon" in x.lower())
                if icon_link and icon_link.get("href"):
                    href = icon_link["href"].strip()
                    favicon_url = urllib.parse.urljoin(url, href)

                # 4. Clean Body Text for AI Analysis
                # Remove scripts, styles, forms, nav, footer, header
                for element in soup(["script", "style", "nav", "footer", "header", "aside", "form", "noscript", "svg"]):
                    element.decompose()

                # Get text from main, article, or body
                main_container = soup.find("main") or soup.find("article") or soup.body
                raw_body_text = ""
                if main_container:
                    lines = (line.strip() for line in main_container.get_text().splitlines())
                    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                    raw_body_text = "\n".join(chunk for chunk in chunks if chunk)

                # Truncate text to avoid token bloat
                clean_text = raw_body_text[:settings.MAX_SCRAPE_CHARS]

                context = f"Website URL: {url}\nJudul: {title}\nMeta Deskripsi: {description}\n\nKonten Teks:\n{clean_text}"

                return ExtractedContent(
                    url=url,
                    platform="Web",
                    title=title,
                    original_description=description or "Tidak ada meta deskripsi.",
                    raw_text=context,
                    favicon_url=favicon_url,
                    raw_metadata={
                        "domain": domain,
                        "status_code": resp.status_code,
                    }
                )

        except Exception as e:
            # Fallback if network or scraping fails
            return ExtractedContent(
                url=url,
                platform="Web",
                title=f"Web: {domain}",
                original_description=f"Tautan web {url}",
                raw_text=f"URL: {url}\nDomain: {domain}\nError Scraper: {str(e)}",
                favicon_url=fallback_favicon,
                raw_metadata={"scrape_error": str(e)}
            )
