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
async def submit_contact_form(payload: dict) -> dict[str, Any]:
    """Save contact form submission to database."""
    db = get_db()
    if db is None:
        # Fallback: just acknowledge without DB
        return {"status": "received", "message": "Thank you for contacting us. We will get back to you soon."}
    
    try:
        contact_doc = {
            "name": payload.get("name", ""),
            "email": payload.get("email", ""),
            "subject": payload.get("subject", ""),
            "message": payload.get("message", ""),
            "created_at": datetime.now(UTC),
            "status": "new",
        }
        result = await db.contact_submissions.insert_one(contact_doc)
        return {
            "status": "success",
            "message": "Thank you for contacting us. We will get back to you soon.",
            "id": str(result.inserted_id),
        }
    except Exception as exc:
        print(f"Failed to save contact submission: {exc}")
        return {"status": "received", "message": "Thank you for contacting us. We will get back to you soon."}


@router.get("/api/contact")
def get_contact(request: Request, incident_key: str = "", city: str = "") -> dict[str, Any]:
    """Get emergency contact information for an incident."""
    store = request.app.state.store
    result = store.resolve_contact(incident_key, city)
    if not result:
        raise HTTPException(status_code=404, detail="No contact found for incident key")
    return result


@router.get("/api/contacts")
def get_contacts(
    request: Request,
    city: str | None = None,
    limit: int = Query(default=200, ge=1, le=500),
) -> dict[str, Any]:
    store = request.app.state.store
    items = store.get_emergency_contacts(city=city, limit=limit)
    return {"count": len(items), "items": items}


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
