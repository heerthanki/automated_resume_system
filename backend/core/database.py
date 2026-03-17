from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from core.config import MONGODB_URL, MONGODB_DB, REDIS_URL

# ── MongoDB ───────────────────────────────────────────────────
mongo_client: AsyncIOMotorClient = None
db = None

async def connect_mongo():
    global mongo_client, db
    mongo_client = AsyncIOMotorClient(MONGODB_URL)
    db = mongo_client[MONGODB_DB]
    print(f"[DB] MongoDB connected → {MONGODB_DB}")

async def disconnect_mongo():
    if mongo_client:
        mongo_client.close()

def get_db():
    return db

# ── Redis ─────────────────────────────────────────────────────
redis_client: aioredis.Redis = None

async def connect_redis():
    global redis_client
    redis_client = await aioredis.from_url(REDIS_URL, decode_responses=True)
    print(f"[Cache] Redis connected → {REDIS_URL}")

async def disconnect_redis():
    if redis_client:
        await redis_client.close()

def get_redis():
    return redis_client
