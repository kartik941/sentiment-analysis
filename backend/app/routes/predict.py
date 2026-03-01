from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import uuid4

from ..database import get_db
from ..models import LivePost, Prediction, CrisisAlert

from ml.api.predict import predict_post
from ml.api.schemas import PredictionRequest, PredictionResponse

router = APIRouter()

@router.post("/predict", response_model=PredictionResponse)
def create_prediction(request: PredictionRequest, db: Session = Depends(get_db)):

    # 1️⃣ Call ML
    result = predict_post(
        text=request.text,
        brand=request.brand,
        platform=request.platform,
        context_posts=request.context_posts or [],
    )

    # 2️⃣ Create Post ID
    post_id = str(uuid4())

    # 3️⃣ Insert into live_posts
    new_post = LivePost(
        id=post_id,
        platform=request.platform,
        brand=request.brand,
        full_text=request.text,
        created_utc=result.processed_at,
    )

    db.add(new_post)
    db.commit()

    # 4️⃣ Insert predictions (one per detected brand)
    for brand_result in result.brands:
        new_prediction = Prediction(
            post_id=post_id,
            brand=brand_result.brand,
            sentiment=brand_result.sentiment,
            sentiment_score=brand_result.score,
            is_sarcastic=result.overall.is_sarcastic,
            sarcasm_score=result.overall.sarcasm_score,
            emotions=result.emotions.emotions,
            topic_id=result.topic.topic_id if result.topic else None,
            topic_label=result.topic.label if result.topic else None,
            crisis_flag=result.crisis.crisis_flag,
        )

        db.add(new_prediction)

    db.commit()

    # 5️⃣ Insert crisis alert if flagged
    if result.crisis.crisis_flag:
        alert = CrisisAlert(
            brand=request.brand,
            alert_type="spike",
            severity=result.crisis.severity,
            message=f"Crisis detected for {request.brand}",
            negative_pct=0.0,
            z_score=0.0,
            window_posts=1,
        )
        db.add(alert)
        db.commit()

    return result

@router.post("/predict/batch")
def batch_predict(request, db: Session = Depends(get_db)):

    results = []

    for item in request.items:

        result = predict_post(
            text=item.text,
            brand=item.brand,
            platform=item.platform,
            context_posts=item.context_posts or [],
        )

        post_id = str(uuid4())

        new_post = LivePost(
            id=post_id,
            platform=item.platform,
            brand=item.brand,
            full_text=item.text,
            created_utc=result.processed_at,
        )

        db.add(new_post)
        db.commit()

        for brand_result in result.brands:
            new_prediction = Prediction(
                post_id=post_id,
                brand=brand_result.brand,
                sentiment=brand_result.sentiment,
                sentiment_score=brand_result.score,
                is_sarcastic=result.overall.is_sarcastic,
                sarcasm_score=result.overall.sarcasm_score,
                emotions=result.emotions.emotions,
                topic_id=result.topic.topic_id if result.topic else None,
                topic_label=result.topic.label if result.topic else None,
                crisis_flag=result.crisis.crisis_flag,
            )

            db.add(new_prediction)

        db.commit()

        if result.crisis.crisis_flag:
            alert = CrisisAlert(
                brand=item.brand,
                alert_type="spike",
                severity=result.crisis.severity,
                message=f"Crisis detected for {item.brand}",
                negative_pct=0.0,
                z_score=0.0,
                window_posts=1,
            )
            db.add(alert)
            db.commit()

        results.append(result)

    return {"results": results}