import asyncio
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from google import genai
from app.config import settings

def test_gemini():
    print("Testing Gemini API Key:")
    print("Key:", settings.GEMINI_API_KEY)
    print("Model:", settings.GEMINI_MODEL)
    
    if not settings.GEMINI_API_KEY:
        print("[ERROR] GEMINI_API_KEY is empty!")
        return

    try:
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        response = client.models.generate_content(
            model=settings.GEMINI_MODEL,
            contents="Say 'Hello LinkSense AI' in one short sentence."
        )
        print("\n[SUCCESS] Respon Gemini AI:", response.text)
    except Exception as e:
        print("\n[ERROR Gemini API]:", type(e).__name__, str(e))

if __name__ == "__main__":
    test_gemini()
