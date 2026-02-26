"""
src/api/schemas.py
MODULE 10 — API Contract  (FROZEN — do not change after backend handoff)

This file defines the exact shape of data flowing in and out of the
prediction system. The backend imports these directly.

WHAT THE BACKEND NEEDS TO DO WITH THIS FILE:
    from src.api.schemas import PredictionRequest, PredictionResponse
    Use PredictionRequest  as your FastAPI POST body type
    Use PredictionResponse as your FastAPI response type
    Import BrandMetrics and CompetitiveSnapshot for dashboard endpoints
    See BACKEND_HANDOFF.md for the full endpoint list and SQL schema

FREEZE RULE:
    Once handed to backend, shapes are frozen.
    ✅ OK: change how models work internally
    ✅ OK: improve accuracy
    ❌ NOT OK: rename keys, change types, add required fields, remove fields

Version: 1.0
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


# ══════════════════════════════════════════════════════════════════════════════
# INPUT
# ══════════════════════════════════════════════════════════════════════════════

class PredictionRequest(BaseModel):
    """What the backend sends TO predict_post()."""

    text:          str             = Field(..., description="Raw post text, uncleaned")
    brand:         Optional[str]   = Field(None, description="Target brand to filter on. None = detect all brands")
    platform:      str             = Field("reddit", description="reddit | news | twitter")
    context_posts: list[str]       = Field([], description="Prior posts for sarcasm context window (up to 3)")


# ══════════════════════════════════════════════════════════════════════════════
# OUTPUT SUB-SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class SentimentResult(BaseModel):
    """Overall sentence-level sentiment (before brand attribution)."""
    label:        str    # "positive" | "neutral" | "negative"
    score:        float  # confidence of winning label, 0.0–1.0
    is_sarcastic: bool
    sarcasm_score: float


class BrandSentimentResult(BaseModel):
    """Sentiment attributed to a specific brand after Module 5."""
    brand:     str
    sentiment: str    # "positive" | "neutral" | "negative"
    score:     float
    method:    str    # "comparative" | "default" | "conflict_resolved"


class EmotionResult(BaseModel):
    """Module 6 output — fine-grained emotions above threshold."""
    emotions:    dict[str, float]  # {"anger": 0.82, "joy": 0.12}
    top_emotion: str


class TopicResult(BaseModel):
    """Module 7 output — discovered topic."""
    topic_id:  int
    label:     str           # e.g. "sole_durability_quality"
    keywords:  list[str]


class CrisisResult(BaseModel):
    """Module 8 output — crisis flag for this post."""
    crisis_flag: bool
    severity:    Optional[str]   # "low" | "medium" | "high" | None


# ══════════════════════════════════════════════════════════════════════════════
# FINAL OUTPUT
# ══════════════════════════════════════════════════════════════════════════════

class PredictionResponse(BaseModel):
    """
    Complete prediction output.
    This is what predict_post() returns and what the backend stores.

    Structure:
        text            → cleaned version of input
        overall         → sentence-level sentiment (Module 4)
        brands          → per-brand attribution (Module 5) — KEY DIFFERENTIATOR
        emotions        → fine-grained emotions (Module 6)
        topic           → discovered topic (Module 7)
        crisis          → crisis signal (Module 8)
        processed_at    → UTC timestamp
    """
    text:         str
    platform:     str
    overall:      SentimentResult
    brands:       list[BrandSentimentResult]    # one entry per detected brand
    emotions:     EmotionResult
    topic:        TopicResult
    crisis:       CrisisResult
    processed_at: datetime


# ══════════════════════════════════════════════════════════════════════════════
# BATCH
# ══════════════════════════════════════════════════════════════════════════════

class BatchPredictionRequest(BaseModel):
    """For processing multiple posts at once (collector.py output)."""
    posts:    list[PredictionRequest]
    brand:    Optional[str] = None


class BatchPredictionResponse(BaseModel):
    results:        list[PredictionResponse]
    total:          int
    processed_at:   datetime


# ══════════════════════════════════════════════════════════════════════════════
# AGGREGATION (for dashboard API endpoints)
# ══════════════════════════════════════════════════════════════════════════════

class BrandMetrics(BaseModel):
    """Aggregated metrics for one brand — served to dashboard."""
    brand:           str
    posts:           int
    computed_at:     datetime
    sentiment_dist:  dict[str, float]    # {"positive": 0.62, "neutral": 0.18, "negative": 0.20}
    hourly_trend:    list[dict]          # [{"hour": "...", "positive_pct": 0.7}, ...]
    emotion_avgs:    dict[str, float]    # {"anger": 0.12, "joy": 0.34, ...}
    top_topics:      list[dict]          # [{"topic": "sole_quality", "count": 42}, ...]
    crisis_posts:    int
    negative_pct:    float


class CompetitiveSnapshot(BaseModel):
    """Cross-brand comparison for the competitive analysis panel."""
    ranking:  list[dict]    # [{"brand": "Nike", "positive_pct": 0.72}, ...]
    leader:   Optional[str]
    laggard:  Optional[str]
    computed_at: datetime
