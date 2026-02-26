from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, session
from sqlalchemy import func
from ..database import get_db
from ..models import Post

router = APIRouter()
@router.get("/summary")
def get_summary(db: session = Depends(get_db)):
    result = (
        db.query(Post.overall_sentiment, func.count(Post.id))
        .group_by(Post.overall_sentiment)
        .all()
    )
    return {sentiment: count for sentiment, count in result}
    



@router.get("/trend")
def get_trend(db: session = Depends(get_db)):
    results = (
        db.query(
            func.date(Post.created_at),
            Post.overall_sentiment,
            func.count(Post.id)
        )
        .group_by(func.date(Post.created_at), Post.overall_sentiment)
        .order_by(func.date(Post.created_at))
        .all()
    )

    trend_data = {}

    for date, sentiment, count in results:
        date_str = str(date)

        if date_str not in trend_data:
            trend_data[date_str] = {}

        trend_data[date_str][sentiment] = count

    return trend_data