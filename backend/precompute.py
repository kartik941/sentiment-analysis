"""
backend/precompute.py
Offline scoring — runs ML pipeline on every post in each brand's CSV
and writes the results to *_scored.csv.

Usage:
    python -m backend.precompute              # score all brands
    python -m backend.precompute --brand Nike  # score one brand

After running, the API endpoints read from _scored.csv (instant).
Re-run this script whenever you collect new data.
"""

import os, sys, json, time, argparse
import pandas as pd
from datetime import datetime, timezone

# ── resolve project root ──────────────────────────────────────────────────────
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

from src.api.predict import predict_post

BRANDS = ["Nike", "Adidas", "Puma", "Reebok"]
COMBINED_DIR = os.path.join(ROOT, "data", "live", "combined")

SCORED_COLUMNS = [
    "id", "type", "platform", "brand", "full_text", "created_utc",
    "title", "url", "source_name",
    # ── ML columns ──
    "sentiment", "sentiment_score",
    "is_sarcastic", "sarcasm_score",
    "top_emotion", "emotions_json",
    "topic_label", "topic_id",
    "crisis_flag",
    "scored_at",
]


def _score_text(text: str, platform: str = "news") -> dict:
    """Run ML pipeline and return a flat dict of scored fields."""
    try:
        r = predict_post(str(text), platform=platform)
        overall = {
            "sentiment": r.overall.label.lower() if hasattr(r.overall, "label") else "neutral",
            "sentiment_score": round(r.overall.score, 3) if hasattr(r.overall, "score") else 0,
            "is_sarcastic": getattr(r.overall, "is_sarcastic", False),
            "sarcasm_score": round(getattr(r.overall, "sarcasm_score", 0.0), 3),
        }
        emotions = {}
        top_emotion = None
        if hasattr(r, "emotions") and r.emotions:
            emotions = {k: round(v, 3) for k, v in (r.emotions.emotions or {}).items()} if r.emotions.emotions else {}
            top_emotion = r.emotions.top_emotion
        topic_label = None
        topic_id = None
        if hasattr(r, "topic") and r.topic:
            topic_label = getattr(r.topic, "label", None)
            topic_id = getattr(r.topic, "topic_id", None)
        crisis_flag = False
        if hasattr(r, "crisis") and r.crisis:
            crisis_flag = getattr(r.crisis, "crisis_flag", False)

        return {
            **overall,
            "top_emotion": top_emotion,
            "emotions_json": json.dumps(emotions),
            "topic_label": topic_label,
            "topic_id": topic_id,
            "crisis_flag": crisis_flag,
            "scored_at": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        return {
            "sentiment": "neutral", "sentiment_score": 0,
            "is_sarcastic": False, "sarcasm_score": 0,
            "top_emotion": None, "emotions_json": "{}",
            "topic_label": None, "topic_id": None,
            "crisis_flag": False,
            "scored_at": datetime.now(timezone.utc).isoformat(),
        }


def score_brand(brand: str):
    """Score all posts for a single brand and write _scored.csv."""
    src = os.path.join(COMBINED_DIR, f"live_combined_{brand.lower()}_latest.csv")
    dst = os.path.join(COMBINED_DIR, f"live_combined_{brand.lower()}_scored.csv")

    if not os.path.exists(src):
        print(f"  ⚠ No CSV found for {brand} at {src}")
        return 0

    df = pd.read_csv(src).dropna(subset=["full_text"])
    total = len(df)
    if total == 0:
        print(f"  ⚠ {brand}: CSV is empty")
        return 0

    print(f"  ▶ {brand}: scoring {total} posts...")
    t0 = time.time()

    scored_rows = []
    for idx, (_, row) in enumerate(df.iterrows()):
        text = str(row.get("full_text", ""))
        ml = _score_text(text, "news")

        scored_row = {
            "id": row.get("id", ""),
            "type": row.get("type", ""),
            "platform": row.get("platform", ""),
            "brand": row.get("brand", brand),
            "full_text": text,
            "created_utc": row.get("created_utc", ""),
            "title": row.get("title", text[:100]),
            "url": row.get("url", ""),
            "source_name": row.get("source_name", "NewsAPI"),
            **ml,
        }
        scored_rows.append(scored_row)

        # Progress indicator every 10 posts
        if (idx + 1) % 10 == 0:
            elapsed = time.time() - t0
            rate = (idx + 1) / elapsed
            eta = (total - idx - 1) / rate if rate > 0 else 0
            print(f"    [{idx+1}/{total}] {rate:.1f} posts/sec, ETA {eta:.0f}s")

    scored_df = pd.DataFrame(scored_rows)
    scored_df.to_csv(dst, index=False)

    elapsed = time.time() - t0
    print(f"  ✅ {brand}: {total} posts scored in {elapsed:.1f}s → {dst}")
    return total


def main():
    parser = argparse.ArgumentParser(description="Pre-compute ML predictions")
    parser.add_argument("--brand", type=str, default=None, help="Score a single brand")
    args = parser.parse_args()

    brands = [args.brand] if args.brand else BRANDS
    print(f"\n{'='*60}")
    print(f"  Pre-computing ML predictions")
    print(f"  Brands: {', '.join(brands)}")
    print(f"{'='*60}\n")

    total = 0
    t0 = time.time()
    for b in brands:
        total += score_brand(b)

    elapsed = time.time() - t0
    print(f"\n{'='*60}")
    print(f"  Done! {total} posts scored in {elapsed:.1f}s")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    main()
