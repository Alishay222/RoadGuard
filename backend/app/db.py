from __future__ import annotations

import hashlib
import json
import os
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

load_dotenv(Path(__file__).resolve().parents[1] / '.env', override=True)

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None

MONGODB_URI = os.getenv("MONGODB_URI", "")
DB_NAME = os.getenv("MONGODB_DB", "roadguard")

# Cache TTL in minutes
CACHE_TTL_MINUTES = 10


async def connect_db() -> None:
    """Open the Motor connection and create indexes. Call once at app startup."""
    global _client, _db

    if not MONGODB_URI:
        print("⚠️  MONGODB_URI not set — MongoDB features disabled.")
        return

    try:
        _client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=8000)
        _db = _client[DB_NAME]

        # Verify connection
        await _client.admin.command("ping")
        print(f"✅ MongoDB connected → {DB_NAME}")

        # TTL index: auto-delete cached docs after expires_at
        await _db.response_cache.create_index(
            "expires_at",
            expireAfterSeconds=0,
            background=True,
        )

        # Unique index on users.email
        await _db.users.create_index("email", unique=True, background=True)

        # Index for fast incident_reports queries
        await _db.incident_reports.create_index("user_email", background=True)
        await _db.incident_reports.create_index("created_at", background=True)

    except Exception as exc:
        print(f"⚠️  MongoDB connection failed: {exc}\n   Running without MongoDB.")
        _client = None
        _db = None


async def close_db() -> None:
    """Close the Motor client. Call at app shutdown."""
    global _client, _db
    if _client:
        _client.close()
        _client = None
        _db = None


def get_db() -> AsyncIOMotorDatabase | None:
    """Return the database instance (or None if not connected)."""
    return _db


def is_connected() -> bool:
    return _db is not None


# ── Cache helpers ─────────────────────────────────────────────────────────────

def _cache_key(cache_type: str, **kwargs: Any) -> str:
    payload = json.dumps({"type": cache_type, **kwargs}, sort_keys=True)
    return hashlib.sha1(payload.encode()).hexdigest()


async def cache_get(cache_type: str, **kwargs: Any) -> list[dict] | dict | None:
    """Return cached data or None if missing/expired."""
    db = get_db()
    if db is None:
        return None
    key = _cache_key(cache_type, **kwargs)
    doc = await db.response_cache.find_one({"_id": key})
    if doc is None:
        return None
    return doc.get("data")


async def cache_set(data: Any, cache_type: str, **kwargs: Any) -> None:
    """Store data in the cache with a TTL."""
    db = get_db()
    if db is None:
        return
    key = _cache_key(cache_type, **kwargs)
    expires_at = datetime.now(UTC) + timedelta(minutes=CACHE_TTL_MINUTES)
    await db.response_cache.update_one(
        {"_id": key},
        {"$set": {"data": data, "expires_at": expires_at, "type": cache_type}},
        upsert=True,
    )
