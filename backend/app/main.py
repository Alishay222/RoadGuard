from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .data_store import RoadGuardDataStore
from .db import close_db, connect_db
from .nlu_service import NLUService
from .response_service import ResponseComposer
from .routers import auth, chat, incidents, nlu

backend_root = Path(__file__).resolve().parents[1]


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    # Initialise heavy services once and store on app.state so routers can
    # access them via Depends(lambda request: request.app.state.<name>)
    app.state.store = RoadGuardDataStore(backend_root)
    app.state.nlu = NLUService(backend_root)
    app.state.composer = ResponseComposer(backend_root)

    app.state.nlu.load_or_train()
    await connect_db()

    yield

    # ── Shutdown ──────────────────────────────────────────────────────────────
    await close_db()


app = FastAPI(title="RoadGuard Backend", version="1.0.0", lifespan=lifespan)

# ── Middleware ────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(incidents.router)
app.include_router(chat.router)
app.include_router(nlu.router)


# ── Health ───────────────────────────────────────────────────────────────────
@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
