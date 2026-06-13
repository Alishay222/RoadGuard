from __future__ import annotations

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: str = ""
    city: str = ""
    vehicle_type: str = ""
    license_plate: str = ""
    driving_experience: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    email: str
    name: str


class UserProfile(BaseModel):
    _id: str = ""
    email: str
    name: str
    phone: str = ""
    city: str = ""
    vehicle_type: str = ""
    license_plate: str = ""
    driving_experience: str = ""
    emergency_contact_name: str = ""
    emergency_contact_phone: str = ""
    language_preference: str = "English"
    created_at: str = ""
    is_admin: bool = False
