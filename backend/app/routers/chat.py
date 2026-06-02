from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from ..models.incident import TextRequest

router = APIRouter(prefix="/api", tags=["Chat"])

DOMAIN_KEYWORDS = [
    "alert", "weather", "rain", "fog", "road", "condition",
    "incident", "accident", "crash", "traffic", "sos",
    "emergency", "ambulance", "police", "help", "fix",
    "tip", "repair", "route", "puncture", "pothole",
]

SMALLTALK_TRIGGERS = [
    "haha", "hehe", "lol", "lmao", "xd",
    "thank", "thanks", "thx", "appreciate",
    "wow", "whoa", "omg", "no way", "seriously",
    "hmm", "hm", "uhh", "umm",
    "interesting", "fascinating", "curious", "tell me more",
    "awesome", "cool", "nice", "great", "perfect", "noted",
]

SMALLTALK_EXACT = {"ok", "okay", "alright", "sure", "yes", "yeah", "yep", "yup", "ya", "no", "nope", "nah"}

EMERGENCY_KEYWORDS = ["sos", "emergency", "help", "ambulance", "police", "fire", "accident", "crash", "urgent"]
POLICE_KEYWORDS = ["police", "15", "cop", "security", "law"]
RESCUE_KEYWORDS = ["ambulance", "rescue", "1122", "medical", "hospital", "fire", "emergency"]


def _is_emergency_request(text_lower: str) -> bool:
    return any(kw in text_lower for kw in EMERGENCY_KEYWORDS)


def _is_police_request(text_lower: str) -> bool:
    return any(kw in text_lower for kw in POLICE_KEYWORDS)


def _is_rescue_request(text_lower: str) -> bool:
    return any(kw in text_lower for kw in RESCUE_KEYWORDS)


def _emergency_contact_message(text_lower: str) -> str:
    if _is_police_request(text_lower):
        return "For police emergencies, call Police 15 immediately at 15."
    if _is_rescue_request(text_lower):
        return "For rescue or ambulance emergencies, call Rescue 1122 immediately at 1122."
    return "For emergencies, call Rescue 1122 immediately at 1122."


def _fill(response: dict, message: str, suggestions: list[str] | None = None,
          data_key: str | None = None, data_value: Any = None) -> dict[str, Any]:
    response["message"] = message
    payload: dict[str, Any] = {}
    if data_key and data_value is not None:
        payload[data_key] = data_value
    if suggestions:
        payload["suggestions"] = suggestions
    response["data"] = payload
    return response


@router.post("/chat")
def chat(request: Request, payload: TextRequest) -> dict[str, Any]:
    nlu = request.app.state.nlu
    store = request.app.state.store
    composer = request.app.state.composer

    nlu_result = nlu.predict(payload.text)
    intent = nlu_result.get("intent", "out_of_domain")
    confidence = float(nlu_result.get("confidence") or 0.0)
    entities = nlu_result.get("entities", {})
    text_lower = payload.text.lower()
    resolved_city = entities.get("city") or payload.city
    incident_key = entities.get("incident_type") or entities.get("issue") or "accident"

    response: dict[str, Any] = {"intent": intent, "confidence": confidence, "entities": entities, "message": "", "data": {}}

    has_domain = any(kw in text_lower for kw in DOMAIN_KEYWORDS)
    is_vague = (len(payload.text.strip().split()) <= 3 and not has_domain) or any(
        p in text_lower for p in ["tell me something", "something", "anything"])
    is_smalltalk = (text_lower.strip() in SMALLTALK_EXACT or any(t in text_lower for t in SMALLTALK_TRIGGERS)) and not has_domain
    is_uncertain = intent in {"fallback", "ood_negative", "out_of_domain"} or confidence < 0.45

    # Location query
    if any(p in text_lower for p in [
        "where am i",
        "my location",
        "your location",
        "current location",
        "current city",
        "my city",
        "what is my location",
        "what's my location",
        "whats my location",
        "what is your location",
        "what's your location",
        "whats your location",
        "what is your current location",
        "what's your current location",
        "whats your current location",
        "what city",
        "which city",
    ]):
        loc = payload.address or (payload.city.title() if payload.city else "an unknown location")
        return _fill(response, f"📍 Based on your GPS, your current location is:\n{loc}", ["Show alerts near me", "Recent incidents"])

    if is_smalltalk:
        st = composer.compose_smalltalk(payload.text)
        return _fill(response, st.message, st.suggestions)

    if is_vague and intent not in {"greet", "smalltalk_bot_ready", "goodbye"}:
        c = composer.compose_clarify(resolved_city)
        return _fill(response, c.message, c.suggestions)

    if intent in {"driver_alerts_near_me", "get_weather_alerts", "road_condition_status"}:
        alerts = store.get_safety_alerts(city=resolved_city, limit=8)
        r = composer.compose_alerts(payload.text, intent, alerts, resolved_city)
        return _fill(response, r.message, r.suggestions, "alerts", alerts)

    if intent in {"find_quick_tips", "how_to_fix_issue"}:
        qf = store.resolve_quick_fix(incident_key)
        r = composer.compose_quick_fix(payload.text, intent, qf)
        return _fill(response, r.message, r.suggestions, "quick_fix", qf)

    if intent in {"ask_emergency_contact", "sos_help", "find_nearby_service"}:
        if _is_emergency_request(text_lower):
            return _fill(response, _emergency_contact_message(text_lower), ["Call emergency services now"])
        if "alert" in text_lower or "weather" in text_lower:
            alerts = store.get_safety_alerts(city=resolved_city, limit=8)
            r = composer.compose_alerts(payload.text, intent, alerts, resolved_city)
            return _fill(response, r.message, r.suggestions, "alerts", alerts)
        if "incident" in text_lower or "accident" in text_lower or "traffic" in text_lower:
            incs = store.search_incidents(payload.text, city=resolved_city, limit=5) or store.get_incidents(
                city=resolved_city, incident_type=entities.get("incident_type"), severity=entities.get("severity"), days=30, limit=20)
            r = composer.compose_incidents(payload.text, intent, incs, resolved_city)
            return _fill(response, r.message, r.suggestions, "incidents", incs)
        contact = store.resolve_contact(incident_key, resolved_city)
        r = composer.compose_contact(payload.text, intent, contact, resolved_city)
        return _fill(response, r.message, r.suggestions, "contact", contact)

    if intent == "status_query" and not any(kw in text_lower for kw in ["traffic","incident","accident","road","alert","weather","safe","route"]):
        c = composer.compose_clarify(resolved_city)
        return _fill(response, c.message, c.suggestions)

    if intent in {"report_incident", "ask_safe_route", "ask_recent_incidents", "status_query"}:
        incs = store.search_incidents(payload.text, city=resolved_city, limit=5) or store.get_incidents(
            city=resolved_city, incident_type=entities.get("incident_type"), severity=entities.get("severity"), days=30, limit=20)
        r = composer.compose_incidents(payload.text, intent, incs, resolved_city)
        return _fill(response, r.message, r.suggestions, "incidents", incs)

    if intent in {"greet", "smalltalk_bot_ready"}:
        g = composer.compose_greet()
        return _fill(response, g.message, g.suggestions)

    if intent == "goodbye":
        gb = composer.compose_goodbye()
        return _fill(response, gb.message)

    if intent in {"confirm", "deny", "cancel_report"}:
        c = composer.compose_clarify(resolved_city)
        return _fill(response, c.message, c.suggestions)

    # Keyword fallback
    if is_uncertain:
        if any(kw in text_lower for kw in ["alert","weather","rain","fog","road condition"]):
            alerts = store.get_safety_alerts(city=resolved_city, limit=8)
            r = composer.compose_alerts(payload.text, intent, alerts, resolved_city)
            return _fill(response, r.message, r.suggestions, "alerts", alerts)
        if any(kw in text_lower for kw in ["incident","accident","crash","traffic"]):
            incs = store.search_incidents(payload.text, limit=5) or store.get_incidents(
                city=resolved_city, incident_type=entities.get("incident_type"), severity=entities.get("severity"), days=30, limit=20)
            r = composer.compose_incidents(payload.text, intent, incs, resolved_city)
            return _fill(response, r.message, r.suggestions, "incidents", incs)
        if any(kw in text_lower for kw in ["sos","emergency","help","ambulance","police"]):
            if _is_emergency_request(text_lower):
                return _fill(response, _emergency_contact_message(text_lower), ["Call emergency services now"])
            contact = store.resolve_contact(incident_key, resolved_city)
            r = composer.compose_contact(payload.text, intent, contact, resolved_city)
            return _fill(response, r.message, r.suggestions, "contact", contact)
        if any(kw in text_lower for kw in ["fix","tip","repair","overheat","puncher","puncture"]):
            qf = store.resolve_quick_fix(incident_key)
            r = composer.compose_quick_fix(payload.text, intent, qf)
            return _fill(response, r.message, r.suggestions, "quick_fix", qf)

    c = composer.compose_clarify(resolved_city)
    return _fill(response, c.message, c.suggestions)
