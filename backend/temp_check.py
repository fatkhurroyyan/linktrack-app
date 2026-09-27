import asyncio
from app.database.session import AsyncSessionLocal
from app.models.link_item import LinkItem
from sqlalchemy import select, func

async def main():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(func.count(LinkItem.id)))
        print(f'Total Links in Supabase: {res.scalar()}')

asyncio.run(main())
