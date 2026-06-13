from __future__ import annotations

from pydantic import BaseModel, Field, EmailStr


class LeadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    message: str = Field(min_length=1, max_length=5000)
    phone: str | None = None


class LeadResponse(BaseModel):
    id: str | None = Field(None, alias="_id")
    name: str
    email: str
    message: str
    phone: str | None = None
    created_at: str
    status: str = "new"

    class Config:
        populate_by_name = True
