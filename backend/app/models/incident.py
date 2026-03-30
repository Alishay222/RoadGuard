from __future__ import annotations

from pydantic import BaseModel, Field


class TextRequest(BaseModel):
    text: str = Field(min_length=1)
    city: str | None = None
    address: str | None = None


class IncidentRequest(BaseModel):
    incident_key: str = Field(min_length=1)
    city: str | None = None


class ReportRequest(BaseModel):
    incidentType: str = Field(default="Accident", min_length=1)
    location: str = Field(min_length=1)
    details: str = Field(min_length=1)
    lat: float | None = None
    lng: float | None = None
