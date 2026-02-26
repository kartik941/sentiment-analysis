from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ml.api.predict import predict_post
from ml.api.schemas import PredictionRequest, PredictionResponse
from ..database import get_db
from ..models import Post

router = APIRouter()


@router.post("/analyze", response_model=PredictionResponse)
def analyze_post(request: PredictionRequest, db: Session = Depends(get_db)):
    try:
        # Call ML pipeline
        result = predict_post(
            text=request.text,
            brand=request.brand,
            platform=request.platform,
            context_posts=request.context_posts
        )

        # Store in DB (Hybrid model)
        db_post = Post(
            text=result.text,
            platform=result.platform,
            overall_sentiment=result.overall.label,
            sentiment_score=result.overall.score,
            crisis_flag=result.crisis.crisis_flag,
            prediction=result.dict()
        )

        db.add(db_post)
        db.commit()
        db.refresh(db_post)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))