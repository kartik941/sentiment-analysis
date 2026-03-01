from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    ForeignKey,
    BigInteger,
    TIMESTAMP,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# ===============================
# 1️⃣ LIVE POSTS TABLE
# ===============================

class LivePost(Base):
    __tablename__ = "live_posts"

    id = Column(String, primary_key=True, index=True)
    platform = Column(String(20), nullable=False)
    brand = Column(String(100), nullable=True)

    full_text = Column(Text)
    url = Column(Text)
    author = Column(String(255))
    score = Column(Integer)

    created_utc = Column(TIMESTAMP(timezone=True))
    collected_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )

    post_metadata = Column("metadata", JSONB)

    # Relationships
    predictions = relationship(
        "Prediction",
        back_populates="post",
        cascade="all, delete"
    )


# ===============================
# 2️⃣ PREDICTIONS TABLE
# ===============================

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    post_id = Column(
        String,
        ForeignKey("live_posts.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    brand = Column(String(100), index=True)
    sentiment = Column(String(20), index=True)
    sentiment_score = Column(Float)

    is_sarcastic = Column(Boolean)
    sarcasm_score = Column(Float)

    emotions = Column(JSONB)

    topic_id = Column(Integer)
    topic_label = Column(Text)

    crisis_flag = Column(Boolean, default=False, index=True)

    predicted_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )

    # Relationship
    post = relationship("LivePost", back_populates="predictions")


# ===============================
# 3️⃣ CRISIS ALERTS TABLE
# ===============================

class CrisisAlert(Base):
    __tablename__ = "crisis_alerts"

    id = Column(BigInteger, primary_key=True, autoincrement=True)

    brand = Column(String(100), index=True)
    alert_type = Column(String(50))
    severity = Column(String(20))
    message = Column(Text)

    negative_pct = Column(Float)
    z_score = Column(Float)
    window_posts = Column(Integer)

    triggered_at = Column(
        TIMESTAMP(timezone=True),
        server_default=func.now()
    )