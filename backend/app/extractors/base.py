import ipaddress
import socket
import urllib.parse
from dataclasses import dataclass, field
from typing import Optional, Any

@dataclass
class ExtractedContent:
    url: str
    platform: str  # "GDrive" | "GitHub" | "Web"
    title: str
    original_description: Optional[str] = None
    raw_text: str = ""
    primary_language: Optional[str] = None
    item_count: Optional[int] = None
    total_size_bytes: Optional[int] = None
    favicon_url: Optional[str] = None
    raw_metadata: dict[str, Any] = field(default_factory=dict)
    child_files: list[dict[str, Any]] = field(default_factory=list)

class SecurityValidator:
    """Validates URLs to prevent SSRF (Server-Side Request Forgery) attacks."""
    
    BLOCKED_IPS = [
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("169.254.0.0/16"),
        ipaddress.ip_network("::1/128"),
        ipaddress.ip_network("fc00::/7"),
        ipaddress.ip_network("fe80::/10"),
    ]

    @classmethod
    def validate_url(cls, url: str) -> str:
        parsed = urllib.parse.urlparse(url.strip())
        
        if parsed.scheme not in ("http", "https"):
            raise ValueError(f"Skema URL '{parsed.scheme}' tidak didukung. Gunakan HTTP atau HTTPS.")
            
        hostname = parsed.hostname
        if not hostname:
            raise ValueError("URL tidak memiliki nama host yang valid.")

        if hostname.lower() in ("localhost", "0.0.0.0", "127.0.0.1", "::1"):
            raise ValueError("Akses ke host lokal (localhost) dilarang untuk alasan keamanan.")

        try:
            # Resolve DNS to check IP range
            ip_str = socket.gethostbyname(hostname)
            ip_obj = ipaddress.ip_address(ip_str)
            for blocked in cls.BLOCKED_IPS:
                if ip_obj in blocked:
                    raise ValueError(f"Akses ke IP privat/internal ({ip_str}) dilarang demi keamanan (SSRF protection).")
        except socket.gaierror:
            # DNS resolution failed - could still be a valid external domain that will fail later gracefully
            pass

        return url.strip()

class BaseExtractor:
    async def extract(self, url: str) -> ExtractedContent:
        raise NotImplementedError
