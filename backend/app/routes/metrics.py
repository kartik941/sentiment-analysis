from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Prediction

router = APIRouter()

@router.get("/metrics/{brand}")
def get_brand_metrics(brand: str, db: Session = Depends(get_db)):

    results = (
        db.query(
            Prediction.sentiment,
            func.count(Prediction.id)
        )
        .filter(Prediction.brand == brand)
        .group_by(Prediction.sentiment)
        .all()
    )

    if not results:
        raise HTTPException(status_code=404, detail="Brand not found")

    metrics = {
        "brand": brand,
        "positive": 0,
        "negative": 0,
        "neutral": 0,
        "total": 0
    }

    for sentiment, count in results:
        metrics[sentiment] = count
        metrics["total"] += count

    return metrics

@router.get("/competitive")
def get_competitive_snapshot(db: Session = Depends(get_db)):

    results = (
        db.query(
            Prediction.brand,
            Prediction.sentiment,
            func.count(Prediction.id)
        )
        .group_by(Prediction.brand, Prediction.sentiment)
        .all()
    )

    competitive = {}

    for brand, sentiment, count in results:

        if brand not in competitive:
            competitive[brand] = {
                "positive": 0,
                "negative": 0,
                "neutral": 0,
                "total": 0
            }

        competitive[brand][sentiment] = count
        competitive[brand]["total"] += count

    return competitive