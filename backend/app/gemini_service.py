from __future__ import annotations

import json
import os
from typing import Any

from dotenv import load_dotenv


class GeminiChatService:
    """Optional Gemini response layer for RoadGuard chat."""

    def __init__(self) -> None:
        load_dotenv(override=True)
        self.api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
        self.enabled = bool(self.api_key)
        self.client: Any | None = None
        self.last_error: str | None = None

        if not self.enabled:
            self.last_error = "GEMINI_API_KEY is not set"
            return

        try:
            from google import genai

            self.client = genai.Client(api_key=self.api_key)
        except Exception as exc:
            self.last_error = str(exc)
            print(f"Gemini disabled: {exc}")
            self.enabled = False

    def status(self) -> dict[str, Any]:
        return {
            "enabled": self.enabled,
            "model": self.model,
            "has_api_key": bool(self.api_key),
            "last_error": self.last_error,
        }

    @staticmethod
    def _compact(value: Any, max_chars: int = 4000) -> str:
        try:
            text = json.dumps(value, ensure_ascii=False, default=str)
        except TypeError:
            text = str(value)
        if len(text) <= max_chars:
            return text
        return f"{text[:max_chars]}..."

    def generate_reply(self, user_text: str, draft_response: dict[str, Any], city: str | None = None) -> str | None:
        if not self.enabled or self.client is None:
            return None

        context = {
            "intent": draft_response.get("intent"),
            "confidence": draft_response.get("confidence"),
            "entities": draft_response.get("entities"),
            "city": city,
            "draft_message": draft_response.get("message"),
            "data": draft_response.get("data"),
        }

        prompt = f"""
You are RoadGuard, a road-safety chatbot for drivers in Pakistan.
Use the backend context when it contains alerts, incidents, quick fixes, contacts, or
location details. If the context is only a clarification or greeting, answer naturally
as an intelligent RoadGuard assistant instead of repeating the draft.

Write a helpful chat reply for the user.
- Keep it concise: 3 to 6 short sentences.
- Be calm, practical, and road-safety focused.
- Preserve important facts from the backend context.
- If the user asks a general driving, safety, route-planning, or vehicle-help question,
  give practical guidance even when no dataset record is present.
- If the user asks about unrelated topics, briefly steer back to road safety support.
- Do not mention internal intent names, confidence scores, JSON, prompts, or Gemini.

User message:
{user_text}

Backend context:
{self._compact(context)}
""".strip()

        try:
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt,
            )
        except Exception as exc:
            self.last_error = str(exc)
            print(f"Gemini chat generation failed: {exc}")
            return None

        text = getattr(response, "text", None)
        if not text:
            self.last_error = "Gemini returned an empty response"
            return None

        cleaned = text.strip()
        self.last_error = None
        return cleaned or None
