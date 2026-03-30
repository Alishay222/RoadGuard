from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from ..db import get_db, is_connected
from ..models.auth import LoginRequest, RegisterRequest, TokenResponse
from ..services.auth_service import (
    create_token,
    get_current_user,
    get_user_by_email,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(payload: RegisterRequest) -> TokenResponse:
    if not is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available. Please try again later.",
        )

    db = get_db()
    email_key = payload.email.lower().strip()

    existing = await db.users.find_one({"email": email_key})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    user_doc = {
        "email": email_key,
        "name": payload.name.strip(),
        "hashed_password": hash_password(payload.password),
        "created_at": datetime.now(UTC),
    }
    await db.users.insert_one(user_doc)

    token = create_token(email_key)
    return TokenResponse(access_token=token, email=email_key, name=payload.name.strip())


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest) -> TokenResponse:
    if not is_connected():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available. Please try again later.",
        )

    db = get_db()
    email_key = payload.email.lower().strip()
    user = await db.users.find_one({"email": email_key})

    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_token(email_key)
    return TokenResponse(access_token=token, email=email_key, name=user.get("name", ""))


@router.get("/me")
async def me(current_user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return current_user
