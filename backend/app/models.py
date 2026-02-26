from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float, Boolean
from datetime import datetime
from .database import Base

class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)

    text = Column(Text, nullable=False)
    platform = Column(String(20), nullable=False, default="reddit")

    # Frequently queried fields
    overall_sentiment = Column(String(20), nullable=False)
    sentiment_score = Column(Float, nullable=False)
    crisis_flag = Column(Boolean, default=False)

    # Full raw prediction (for future use)
    prediction = Column(JSON, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)