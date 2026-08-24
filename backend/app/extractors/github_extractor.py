import re
import httpx
from typing import Optional
from app.config import settings
from app.extractors.base import BaseExtractor, ExtractedContent

class GitHubExtractor(BaseExtractor):
    """
    Extractor for GitHub repositories.
    Uses GitHub REST API to fetch repository metadata, topics, languages, and full README.md content.
    """

    REPO_REGEX = re.compile(r"github\.com/([a-zA-Z0-9_.-]+)/([a-zA-Z0-9_.-]+)")

    @classmethod
    def can_handle(cls, url: str) -> bool:
        return "github.com" in url

    def parse_owner_repo(self, url: str) -> tuple[Optional[str], Optional[str]]:
        # Remove trailing slash or .git
        clean_url = url.rstrip("/").removesuffix(".git")
        if m := self.REPO_REGEX.search(clean_url):
            owner = m.group(1)
            repo = m.group(2)
            # Exclude special github pages like /pricing, /features, /explore
            if owner.lower() in ("features", "pricing", "explore", "topics", "marketplace", "trending", "about"):
                return None, None
            return owner, repo
        return None, None

    async def extract(self, url: str) -> ExtractedContent:
        owner, repo = self.parse_owner_repo(url)
        if not owner or not repo:
            raise ValueError(f"URL '{url}' bukan tautan repositori GitHub yang valid.")

        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "LinkSense-AI-Curator/1.0",
        }
        if settings.GITHUB_TOKEN:
            headers["Authorization"] = f"Bearer {settings.GITHUB_TOKEN}"

        async with httpx.AsyncClient(timeout=settings.REQUEST_TIMEOUT_SECONDS, follow_redirects=True) as client:
            # 1. Fetch Repository Metadata
            repo_api_url = f"https://api.github.com/repos/{owner}/{repo}"
            repo_resp = await client.get(repo_api_url, headers=headers)
            
            if repo_resp.status_code == 404:
                raise ValueError(f"Repositori GitHub '{owner}/{repo}' tidak ditemukan atau bersifat privat.")
            elif repo_resp.status_code != 200:
                raise ValueError(f"GitHub API Error ({repo_resp.status_code}): {repo_resp.text}")

            repo_data = repo_resp.json()
            full_name = repo_data.get("full_name", f"{owner}/{repo}")
            description = repo_data.get("description") or "Tidak ada deskripsi singkat."
            primary_language = repo_data.get("language")
            topics = repo_data.get("topics", [])
            stars = repo_data.get("stargazers_count", 0)
            forks = repo_data.get("forks_count", 0)
            license_name = repo_data.get("license", {}).get("spdx_id") if repo_data.get("license") else None

            # 2. Fetch README.md Content
            readme_text = ""
            readme_headers = {**headers, "Accept": "application/vnd.github.v3.raw"}
            readme_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
            readme_resp = await client.get(readme_url, headers=readme_headers)
            
            if readme_resp.status_code == 200:
                readme_raw = readme_resp.text
                # Remove common markdown badge images and comments to clean text for AI
                cleaned_readme = re.sub(r"\[!\[.*?\]\(.*?\)\]\(.*?\)", "", readme_raw)
                cleaned_readme = re.sub(r"!\[.*?\]\(.*?\)", "", cleaned_readme)
                cleaned_readme = re.sub(r"<!--[\s\S]*?-->", "", cleaned_readme)
                readme_text = cleaned_readme.strip()[:8000]

            # Construct structured context for Gemini AI
            context_parts = [
                f"GitHub Repository: {full_name}",
                f"Deskripsi: {description}",
                f"Bahasa Utama: {primary_language or 'Tidak spesifik'}",
                f"Topics/Tags: {', '.join(topics) if topics else 'None'}",
                f"Stars: {stars} | Forks: {forks} | License: {license_name or 'None'}",
                "",
                "Konten README:",
                readme_text if readme_text else "README tidak tersedia."
            ]
            raw_text = "\n".join(context_parts)

            return ExtractedContent(
                url=url,
                platform="GitHub",
                title=f"{full_name}: {description[:80]}" if description else full_name,
                original_description=description,
                raw_text=raw_text,
                primary_language=primary_language,
                favicon_url="https://github.githubassets.com/favicons/favicon.png",
                raw_metadata={
                    "owner": owner,
                    "repo": repo,
                    "stars": stars,
                    "forks": forks,
                    "topics": topics,
                    "license": license_name,
                    "open_issues": repo_data.get("open_issues_count", 0),
                    "homepage": repo_data.get("homepage"),
                }
            )
