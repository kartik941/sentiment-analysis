"""
src/aggregation/aggregator.py
MODULE 9 — Aggregation & Analytics Layer

Converts raw per-post predictions into brand-level business metrics.
Runs after every collection + prediction cycle.

Metrics computed per brand:
    - Sentiment distribution (% positive/neutral/negative)
    - Sentiment trend over time (hourly rolling)
    - Emotion breakdown (avg scores per emotion)
    - Top topics this period
    - Crisis indicators

Output: aggregated_metrics table in Supabase
        + CSV backup to outputs/reports/

Used by: FastAPI serving layer, Streamlit dashboard
"""

from __future__ import annotations
import pandas as pd
from datetime import datetime, timezone


def aggregate(predictions_df: pd.DataFrame, brand: str) -> dict:
    """
    Compute all business metrics for one brand from a predictions DataFrame.

    Args:
        predictions_df: DataFrame with columns:
            post_id, brand, sentiment, sentiment_score,
            is_sarcastic, emotions (dict), topic_id, topic_label,
            crisis_flag, predicted_at

        brand: brand name to filter on

    Returns:
        dict with all computed metrics — saved to DB and dashboard
    """
    df = predictions_df[predictions_df["brand"] == brand].copy()
    if df.empty:
        return {"brand": brand, "posts": 0}

    # ── Sentiment distribution ────────────────────────────────────────────────
    sentiment_counts = df["sentiment"].value_counts()
    total            = len(df)
    sentiment_dist   = {
        "positive": round(sentiment_counts.get("positive", 0) / total, 4),
        "neutral":  round(sentiment_counts.get("neutral",  0) / total, 4),
        "negative": round(sentiment_counts.get("negative", 0) / total, 4),
    }

    # ── Hourly trend (last 24 hours) ──────────────────────────────────────────
    df["hour"] = pd.to_datetime(df["predicted_at"]).dt.floor("h")
    hourly = (
        df.groupby("hour")["sentiment"]
        .apply(lambda x: (x == "positive").mean())
        .reset_index()
        .rename(columns={"sentiment": "positive_pct"})
    )
    trend = hourly.to_dict("records")

    # ── Emotion breakdown ─────────────────────────────────────────────────────
    emotion_avgs = {}
    if "emotions" in df.columns:
        all_emotions = pd.json_normalize(df["emotions"].dropna())
        if not all_emotions.empty:
            emotion_avgs = all_emotions.mean().round(4).to_dict()

    # ── Top topics ────────────────────────────────────────────────────────────
    top_topics = []
    if "topic_label" in df.columns:
        top_topics = (
            df["topic_label"].value_counts()
            .head(5)
            .reset_index()
            .rename(columns={"index": "topic", "topic_label": "count"})
            .to_dict("records")
        )

    # ── Crisis indicators ─────────────────────────────────────────────────────
    crisis_posts  = int(df["crisis_flag"].sum()) if "crisis_flag" in df.columns else 0
    sarcasm_posts = int(df["is_sarcastic"].sum()) if "is_sarcastic" in df.columns else 0

    return {
        "brand":              brand,
        "posts":              total,
        "computed_at":        datetime.now(timezone.utc).isoformat(),
        "sentiment_dist":     sentiment_dist,
        "hourly_trend":       trend,
        "emotion_avgs":       emotion_avgs,
        "top_topics":         top_topics,
        "crisis_posts":       crisis_posts,
        "sarcasm_posts":      sarcasm_posts,
        "negative_pct":       sentiment_dist["negative"],
    }


def aggregate_all_brands(predictions_df: pd.DataFrame) -> list[dict]:
    """Run aggregate() for every brand present in the predictions DataFrame."""
    brands = predictions_df["brand"].unique()
    return [aggregate(predictions_df, brand) for brand in brands]


def compare_brands(metrics_list: list[dict]) -> dict:
    """
    Competitive comparison across brands.
    Used by the dashboard competitive analysis panel.

    Returns:
        {
            "ranking": [{"brand": "Nike", "positive_pct": 0.72}, ...],
            "leader":  "Nike",
            "laggard": "Puma",
        }
    """
    ranking = sorted(
        [{"brand": m["brand"], "positive_pct": m["sentiment_dist"]["positive"]}
         for m in metrics_list if m.get("posts", 0) > 0],
        key=lambda x: -x["positive_pct"],
    )
    return {
        "ranking": ranking,
        "leader":  ranking[0]["brand"]  if ranking else None,
        "laggard": ranking[-1]["brand"] if ranking else None,
    }
