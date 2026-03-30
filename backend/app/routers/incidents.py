from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query, Request

from ..db import cache_get, cache_set, get_db
from ..models.incident import IncidentRequest, ReportRequest
from ..services.auth_service import get_current_user
from fastapi import Depends

router = APIRouter(tags=["Incidents"])


@router.get("/api/incidents")
async def get_incidents(
    request: Request,
    city: str | None = None,
    incident_type: str | None = None,
    severity: str | None = None,
    days: int = Query(default=30, ge=1, le=3650),
    limit: int = Query(default=100, ge=1, le=500),
) -> dict[str, Any]:
    store = request.app.state.store
    cached = await cache_get("incidents", city=city, incident_type=incident_type,
                              severity=severity, days=days, limit=limit)
    if cached is not None:
        return {"count": len(cached), "items": cached, "cached": True}

    data = store.get_incidents(city=city, incident_type=incident_type,
                               severity=severity, days=days, limit=limit)
    await cache_set(data, "incidents", city=city, incident_type=incident_type,
                    severity=severity, days=days, limit=limit)
    return {"count": len(data), "items": data}


@router.get("/api/alerts")
async def get_alerts(
    request: Request,
    city: str | None = None,
    limit: int = Query(default=10, ge=1, le=100),
) -> dict[str, Any]:
    store = request.app.state.store
    cached = await cache_get("alerts", city=city, limit=limit)
    if cached is not None:
        return {"count": len(cached), "items": cached, "cached": True}

    data = store.get_safety_alerts(city=city, limit=limit)
    await cache_set(data, "alerts", city=city, limit=limit)
    return {"count": len(data), "items": data}


@router.get("/api/quick-fix/{incident_key}")
def get_quick_fix(request: Request, incident_key: str) -> dict[str, Any]:
    store = request.app.state.store
    result = store.resolve_quick_fix(incident_key)
    if not result:
        raise HTTPException(status_code=404, detail="No quick-fix found for incident key")
    return result


@router.post("/api/contact")
def get_contact(request: Request, payload: IncidentRequest) -> dict[str, Any]:
    store = request.app.state.store
    result = store.resolve_contact(payload.incident_key, payload.city)
    if not result:
        raise HTTPException(status_code=404, detail="No contact found for incident key")
    return result


@router.post("/api/incidents/report")
async def submit_report(
    payload: ReportRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database not available.")

    doc = {
        "user_email": current_user["email"],
        "incident_type": payload.incidentType,
        "location": payload.location,
        "details": payload.details,
        "lat": payload.lat,
        "lng": payload.lng,
        "status": "pending",
        "created_at": datetime.now(UTC),
    }
    result = await db.incident_reports.insert_one(doc)
    return {"success": True, "id": str(result.inserted_id), "message": "Incident report submitted successfully."}
