"""Admin API routes for dashboard and user management."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from datetime import UTC, datetime, timedelta

from app.services.auth_service import get_current_user
from app.db import get_db
from app.models.lead import LeadRequest, LeadResponse

router = APIRouter()


@router.get("/api/admin/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_user)):
    """Get admin dashboard statistics."""
    db = get_db()
    if db is None or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        # Count total users
        total_users = await db.users.count_documents({})
        
        # Count total admins
        total_admins = await db.users.count_documents({"is_admin": True})
        
        # Count total incidents
        total_incidents = await db.incident_reports.count_documents({})
        
        # Count pending incidents
        pending_incidents = await db.incident_reports.count_documents({"status": "pending"})
        
        # Count active users (users with is_active not set to False)
        active_users = await db.users.count_documents({"is_active": {"$ne": False}})

        # Get recent incidents
        recent_incidents = await db.incident_reports.find(
            {}, 
            {"_id": 0}
        ).sort("created_at", -1).limit(5).to_list(5)

        return {
            "stats": {
                "totalUsers": total_users,
                "totalAdmins": total_admins,
                "totalIncidents": total_incidents,
                "pendingIncidents": pending_incidents,
                "activeUsers": active_users,
            },
            "recentIncidents": recent_incidents or [],
        }
    except Exception as e:
        print(f"Error fetching admin stats: {e}")
        return {
            "stats": {
                "totalUsers": 0,
                "totalAdmins": 0,
                "totalIncidents": 0,
                "pendingIncidents": 0,
                "activeUsers": 0,
            },
            "recentIncidents": [],
        }


@router.get("/api/admin/users")
async def get_admin_users(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(5000, ge=1, le=5000),
):
    """Get all users (paginated)."""
    db = get_db()
    if db is None or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        users = await db.users.find(
            {},
            {
                "_id": 1,
                "email": 1,
                "name": 1,
                "phone": 1,
                "city": 1,
                "vehicle_type": 1,
                "license_plate": 1,
                "driving_experience": 1,
                "emergency_contact_name": 1,
                "emergency_contact_phone": 1,
                "language_preference": 1,
                "is_active": 1,
                "is_admin": 1,
                "created_at": 1,
            },
        ).sort("created_at", -1).limit(limit).to_list(limit)

        # Convert ObjectId to string for JSON serialization
        for user in users:
            user["_id"] = str(user.get("_id", ""))
            # Default is_active to True if not set
            if "is_active" not in user:
                user["is_active"] = True
            if "is_admin" not in user:
                user["is_admin"] = False

        return {"users": users}
    except Exception as e:
        print(f"Error fetching users: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch users")


@router.delete("/api/admin/users/{user_id}")
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Delete a user by ID."""
    db = get_db()
    if db is None or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        from bson import ObjectId
        
        # Prevent deleting self
        current_user_doc = await db.users.find_one({"email": current_user["email"]})
        if str(current_user_doc.get("_id")) == user_id:
            raise HTTPException(status_code=400, detail="Cannot delete your own account")
        
        result = await db.users.delete_one({"_id": ObjectId(user_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {"success": True, "message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error deleting user: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")


@router.put("/api/admin/users/{user_id}/status")
async def toggle_user_status(
    user_id: str,
    active: bool,
    current_user: dict = Depends(get_current_user),
):
    """Activate or deactivate a user."""
    db = get_db()
    if db is None or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        from bson import ObjectId
        
        # Prevent deactivating self
        current_user_doc = await db.users.find_one({"email": current_user["email"]})
        if str(current_user_doc.get("_id")) == user_id and not active:
            raise HTTPException(status_code=400, detail="Cannot deactivate your own account")
        
        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_active": active}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")
        
        status_text = "activated" if active else "deactivated"
        return {"success": True, "message": f"User {status_text} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating user status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update user status: {str(e)}")


@router.put("/api/admin/users/{user_id}/admin")
async def toggle_user_admin(
    user_id: str,
    admin: bool,
    current_user: dict = Depends(get_current_user),
):
    """Promote or demote a user as an admin."""
    db = get_db()
    if db is None or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        from bson import ObjectId

        current_user_doc = await db.users.find_one({"email": current_user["email"]})
        if current_user_doc and str(current_user_doc.get("_id")) == user_id and not admin:
            raise HTTPException(status_code=400, detail="Cannot remove your own admin access")

        result = await db.users.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"is_admin": admin}},
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="User not found")

        status_text = "granted" if admin else "revoked"
        return {"success": True, "message": f"Admin access {status_text} successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating admin role: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update admin role: {str(e)}")


@router.get("/api/admin/incidents")
async def get_admin_incidents(
    current_user: dict = Depends(get_current_user),
    status: str = Query("all"),
    limit: int = Query(50, ge=1, le=500),
):
    """Get incidents (filtered by status)."""
    db = get_db()
    if db is None or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        query = {}
        if status != "all":
            query["status"] = status

        incidents = await db.incident_reports.find(
            query,
            {
                "_id": 1,
                "incident_type": 1,
                "location": 1,
                "user_email": 1,
                "status": 1,
                "created_at": 1,
            },
        ).sort("created_at", -1).limit(limit).to_list(limit)

        # Convert ObjectId to string for JSON serialization
        for incident in incidents:
            incident["_id"] = str(incident.get("_id", ""))

        return {"incidents": incidents}
    except Exception as e:
        print(f"Error fetching incidents: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch incidents")


# ─────────────────────────────────────────────────────────────────────
# LEADS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────

@router.post("/api/leads")
async def submit_lead(lead: LeadRequest):
    """Submit a contact form lead."""
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database connection failed")

    try:
        lead_doc = {
            "name": lead.name,
            "email": lead.email,
            "message": lead.message,
            "phone": lead.phone,
            "status": "new",
            "created_at": datetime.now(UTC).isoformat(),
        }
        
        result = await db.leads.insert_one(lead_doc)
        
        return {
            "success": True,
            "message": "Thank you for your inquiry. We will get back to you soon!",
            "lead_id": str(result.inserted_id),
        }
    except Exception as e:
        print(f"Error submitting lead: {e}")
        raise HTTPException(status_code=500, detail="Failed to submit inquiry")


@router.get("/api/admin/leads")
async def get_admin_leads(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(5000, ge=1, le=5000),
):
    """Get all leads (admin only)."""
    db = get_db()
    if db is None or not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        leads = await db.leads.find(
            {},
            {
                "_id": 1,
                "name": 1,
                "email": 1,
                "message": 1,
                "phone": 1,
                "status": 1,
                "created_at": 1,
            },
        ).sort("created_at", -1).limit(limit).to_list(limit)

        # Convert ObjectId to string for JSON serialization
        for lead in leads:
            lead["_id"] = str(lead.get("_id", ""))

        return {"leads": leads}
    except Exception as e:
        print(f"Error fetching leads: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch leads")
