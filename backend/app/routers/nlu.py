from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Request

from ..models.incident import TextRequest

router = APIRouter(prefix="/api/nlu", tags=["NLU"])


@router.post("/train")
def train_nlu(request: Request) -> dict[str, Any]:
    nlu = request.app.state.nlu
    result = nlu.train()
    return {
        "status": "trained",
        "trained_at": result.trained_at,
        "train_rows": result.train_rows,
        "val_rows": result.val_rows,
        "accuracy": result.accuracy,
        "intents": result.intents,
    }


@router.get("/status")
def nlu_status(request: Request) -> dict[str, Any]:
    return request.app.state.nlu.get_status()


@router.post("/predict")
def predict_nlu(request: Request, payload: TextRequest) -> dict[str, Any]:
    return request.app.state.nlu.predict(payload.text)
