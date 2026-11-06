"""CRUD regression tests. All storage is in memory; external AI is simulated."""
import os
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["GEMINI_API_KEY"] = ""

import asyncio
import json
import time
import unittest
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
from sqlalchemy import event, select, func
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

from app.main import app
from app.database.session import Base, get_db
from app.models.link_item import Category, LinkItem, LinkTag, GDriveFile
from app.services.ai_service import AIService
from app.services.orchestrator import link_orchestrator
from app.extractors.base import ExtractedContent, SecurityValidator
from app.config import settings


class CrudPerformanceTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.engine = create_async_engine("sqlite+aiosqlite:///:memory:")
        async with self.engine.begin() as connection:
            await connection.exec_driver_sql("PRAGMA foreign_keys=ON")
            await connection.run_sync(Base.metadata.create_all)
        self.sessions = async_sessionmaker(self.engine, expire_on_commit=False)
        async def override_db():
            async with self.sessions() as session:
                yield session
        app.dependency_overrides[get_db] = override_db
        self.client = httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test")

    async def asyncTearDown(self):
        await self.client.aclose()
        app.dependency_overrides.clear()
        await self.engine.dispose()

    async def seed(self, **overrides):
        values = dict(id="one", url="https://example.com/one", title="Reference", platform="Web",
                      primary_category="Target", secondary_category="Other",
                      tags=[LinkTag(tag_name="reference")],
                      gdrive_files=[GDriveFile(file_name="notes.pdf")])
        values.update(overrides)
        async with self.sessions() as session:
            session.add(LinkItem(**values))
            await session.commit()

    async def test_categories_use_one_query_and_count_both_slots_once(self):
        async with self.sessions() as session:
            session.add_all([Category(id=f"c{i}", name=f"Topic {i}") for i in range(30)])
            await session.commit()
        await self.seed(primary_category="Topic 0", secondary_category="Topic 0")
        await self.seed(id="two", url="https://example.com/two", primary_category="Topic 1", secondary_category="Topic 0")
        queries = []
        def record(*args): queries.append(args[2])
        event.listen(self.engine.sync_engine, "before_cursor_execute", record)
        try: response = await self.client.get("/api/v1/categories")
        finally: event.remove(self.engine.sync_engine, "before_cursor_execute", record)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(queries), 1)
        counts = {category["name"]: category["usage_count"] for category in response.json()}
        self.assertEqual(counts["Topic 0"], 2)
        self.assertEqual(counts["Topic 1"], 1)
        self.assertEqual(counts["Topic 29"], 0)

    async def test_analytics_preserve_totals_recent_and_empty_platforms(self):
        empty = (await self.client.get("/api/v1/analytics/stats")).json()
        self.assertEqual(empty["total_links"], 0)
        self.assertEqual(empty["recent_count_7d"], 0)
        await self.seed()
        await self.seed(id="old", url="https://example.com/old", platform="GitHub", created_at=datetime.now(timezone.utc)-timedelta(days=20))
        response = await self.client.get("/api/v1/analytics/stats")
        data = response.json()
        self.assertEqual(data["total_links"], 2)
        self.assertEqual(data["recent_count_7d"], 1)
        self.assertEqual(data["platform_counts"], {"Web": 1, "GitHub": 1, "Google Drive": 0})
        self.assertEqual(data["top_tags"][0], {"tag": "reference", "count": 2})

    async def test_update_does_not_recreate_unchanged_tags_or_lose_files(self):
        await self.seed()
        async with self.sessions() as session:
            tag_id = (await session.execute(select(LinkTag.id))).scalar_one()
        response = await self.client.put("/api/v1/links/one", json={"title": "Edited", "secondary_category": "", "tags": [" Reference "]})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["title"], "Edited")
        self.assertIsNone(data["secondary_category"])
        self.assertEqual(data["categories"], ["Target"])
        self.assertEqual(data["tags"], ["reference"])
        self.assertEqual(data["gdrive_files"][0]["file_name"], "notes.pdf")
        self.assertTrue(data["updated_at"])
        async with self.sessions() as session:
            self.assertEqual((await session.execute(select(LinkTag.id))).scalar_one(), tag_id)
        persisted = (await self.client.get("/api/v1/links/one")).json()
        self.assertEqual(persisted["title"], "Edited")
        self.assertIsNone(persisted["secondary_category"])

    async def test_changed_tags_and_locked_primary_category_still_work(self):
        await self.seed(platform="GitHub", primary_category="GitHub")
        response = await self.client.put("/api/v1/links/one", json={"primary_category": "Invalid", "tags": ["new", "python"]})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["primary_category"], "GitHub")
        self.assertEqual(sorted(response.json()["tags"]), ["new", "python"])

    async def test_delete_removes_children_with_foreign_keys_enabled(self):
        await self.seed()
        await self.seed(id="keep", url="https://example.com/keep")
        response = await self.client.delete("/api/v1/links/one")
        self.assertEqual(response.status_code, 204)
        self.assertEqual((await self.client.delete("/api/v1/links/one")).status_code, 404)
        async with self.sessions() as session:
            for model in [LinkTag, GDriveFile]:
                count = (await session.execute(select(func.count()).select_from(model).where(model.link_id == "one"))).scalar_one()
                self.assertEqual(count, 0)
            self.assertIsNotNone(await session.get(LinkItem, "keep"))

    async def test_force_category_delete_preserves_reassignment_and_guards(self):
        async with self.sessions() as session:
            session.add_all([Category(id="target", name="Target"), Category(id="system", name="GDrive", is_system=True)])
            await session.commit()
        cases = [("promote", "Web", "Target", "Other", "Other"),
                 ("same", "Web", "Target", "Target", "Produktivitas & Tools"),
                 ("github", "GitHub", "Target", None, "GitHub"),
                 ("drive", "Google Drive", "Target", None, "GDrive"),
                 ("secondary", "Web", "Other", "Target", "Other")]
        for key, platform, primary, secondary, _ in cases:
            await self.seed(id=key, url=f"https://example.com/{key}", platform=platform, primary_category=primary, secondary_category=secondary)
        self.assertEqual((await self.client.delete("/api/v1/categories/target")).status_code, 409)
        self.assertEqual((await self.client.delete("/api/v1/categories/system?force=true")).status_code, 400)
        response = await self.client.delete("/api/v1/categories/target?force=true")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["affected_links"], 5)
        for key, _, _, _, expected in cases:
            item = (await self.client.get(f"/api/v1/links/{key}")).json()
            self.assertEqual(item["primary_category"], expected)
            self.assertIsNone(item["secondary_category"])
            self.assertEqual(item["tags"], ["reference"])
            self.assertEqual(len(item["gdrive_files"]), 1)

    async def test_create_returns_populated_defaults_without_refresh(self):
        response = await self.client.post("/api/v1/categories", json={"name": "Fresh category"})
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.json()["id"])
        self.assertTrue(response.json()["created_at"])
        content = ExtractedContent(url="https://example.com/new", platform="Web", title="Fresh reference", child_files=[{"file_name": "guide.pdf"}])
        extractor = SimpleNamespace(extract=AsyncMock(return_value=content))
        with patch.object(SecurityValidator, "validate_url", return_value=content.url), patch.object(link_orchestrator, "select_extractor", return_value=extractor):
            response = await self.client.post("/api/v1/links/process", json={"url": content.url})
        self.assertEqual(response.status_code, 201, response.text)
        data = response.json()
        self.assertTrue(data["id"])
        self.assertTrue(data["created_at"])
        self.assertTrue(data["tags"])
        self.assertEqual(data["gdrive_files"][0]["file_name"], "guide.pdf")
        self.assertTrue(data["gdrive_files"][0]["id"])


class AsyncAITests(unittest.IsolatedAsyncioTestCase):
    async def test_slow_ai_leaves_event_loop_responsive(self):
        service = AIService()
        content = ExtractedContent(url="https://example.com", platform="Web", title="Reference")
        data = service._heuristic_categorize(content).model_dump()
        async def generate(**kwargs):
            await asyncio.sleep(.3)
            return SimpleNamespace(text=json.dumps(data))
        client = SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content=generate)))
        task = asyncio.create_task(service._call_gemini(client, content))
        start = time.perf_counter()
        await asyncio.sleep(.02)
        self.assertLess(time.perf_counter()-start, .2)
        await task

    async def test_primary_error_uses_async_fallback_and_enforces_platform(self):
        service = AIService()
        content = ExtractedContent(url="https://github.com/owner/repo", platform="GitHub", title="Reference")
        data = service._heuristic_categorize(content).model_dump()
        data.update(primary_category="Wrong", platform="Web")
        generate = AsyncMock(side_effect=[RuntimeError("Simulated primary failure"), SimpleNamespace(text=json.dumps(data))])
        client = SimpleNamespace(aio=SimpleNamespace(models=SimpleNamespace(generate_content=generate)))
        result = await service._call_gemini(client, content)
        self.assertEqual(generate.await_count, 2)
        self.assertEqual(result.primary_category, "GitHub")
        self.assertEqual(result.platform, "GitHub")

    async def test_ai_deadline_cancels_work_and_uses_existing_heuristic(self):
        service = AIService()
        content = ExtractedContent(url="https://example.com", platform="Web", title="Reference")
        cancelled = asyncio.Event()
        async def slow(*args):
            try: await asyncio.sleep(1)
            finally: cancelled.set()
        with patch.object(settings, "REQUEST_TIMEOUT_SECONDS", .02), patch.object(service, "_get_client", return_value=object()), patch.object(service, "_call_gemini", side_effect=slow):
            result = await service.categorize_and_summarize(content)
        self.assertTrue(cancelled.is_set())
        self.assertEqual(result.title, "Reference")


if __name__ == "__main__":
    unittest.main()
