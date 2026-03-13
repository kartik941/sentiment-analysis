"""
src/attribution/engine.py
MODULE 5 — Hybrid Attribution Engine  ⭐ THE KEY DIFFERENTIATOR

Converts sentence-level sentiment → brand-level sentiment.
This is what makes the system brand monitoring, not just sentiment.

Three sub-modules:
    5.1  Comparative Pattern Detector
         "Nike is better than Puma" → Nike=positive, Puma=negative

    5.2  Default Attribution
         "I love Nike shoes" → Nike=positive (overall sentiment assigned)

    5.3  Conflict Resolver
         Multi-brand + mixed signals → resolved per brand

Pipeline per text:
    clean text
        → detect brands          (brand/detector.py)
        → predict sentiment      (models/sentiment.py)
        → detect sarcasm         (models/sarcasm.py)
        → if sarcastic: flip sentiment
        → detect comparisons     (5.1)
        → attribute per brand    (5.2 / 5.3)
        → return brand results   (list of BrandSentiment)

Used by: api/predict.py
"""

from __future__ import annotations
import re
from dataclasses import dataclass

# ── Comparative pattern rules ─────────────────────────────────────────────────
# Each tuple: (regex pattern, brand_before_sentiment, brand_after_sentiment)
# "brand_before" = brand that appears BEFORE the keyword in the sentence
# "brand_after"  = brand that appears AFTER the keyword

COMPARISON_PATTERNS: list[tuple[re.Pattern, str, str]] = [
    (re.compile(r"\bbetter\s+than\b",    re.I), "positive", "negative"),
    (re.compile(r"\bworse\s+than\b",     re.I), "negative", "positive"),
    (re.compile(r"\bbeats\b",            re.I), "positive", "negative"),
    (re.compile(r"\boutperforms\b",      re.I), "positive", "negative"),
    (re.compile(r"\bsuperior\s+to\b",    re.I), "positive", "negative"),
    (re.compile(r"\bprefer\b.{0,30}\bover\b", re.I), "positive", "negative"),
    (re.compile(r"\bwins\s+over\b",      re.I), "positive", "negative"),
    (re.compile(r"\bswitched\s+from\b",  re.I), "negative", "positive"),
    (re.compile(r"\bunlike\b",           re.I), "negative", "positive"),
    (re.compile(r"\bnot\s+as\s+good\s+as\b", re.I), "negative", "positive"),
]

# Sentiment flip for sarcasm
FLIP = {"positive": "negative", "negative": "positive", "neutral": "neutral"}


@dataclass
class BrandSentiment:
    """Single brand-level sentiment result."""
    brand:        str
    sentiment:    str    # "positive" | "negative" | "neutral"
    score:        float  # confidence
    is_sarcastic: bool
    method:       str    # "comparative" | "default" | "conflict_resolved"


def attribute(
    text:             str,
    detected_brands:  list[str],
    sentiment_result: dict,
    sarcasm_result:   dict,
    brand_positions:  list[dict],
) -> list[BrandSentiment]:
    """
    Main attribution function. Called once per text.

    Args:
        text:             cleaned text
        detected_brands:  output of brand.detector.detect()
        sentiment_result: output of models.sentiment.SentimentModel.predict()
        sarcasm_result:   output of models.sarcasm.SarcasmModel.predict()
        brand_positions:  output of brand.detector.detect_with_positions()

    Returns:
        List of BrandSentiment — one entry per detected brand.
        Empty list if no brands detected.
    """
    if not detected_brands:
        return []

    overall_sentiment = sentiment_result["label"]
    overall_score     = sentiment_result["score"]
    is_sarcastic      = sarcasm_result["is_sarcastic"]

    # Sarcasm flip — if ironic, flip overall sentiment before attribution
    if is_sarcastic and overall_sentiment == "positive":
        overall_sentiment = "negative"

    # ── Sub-module 5.1 — Comparative Pattern Detection ────────────────────────
    comparative_results = _detect_comparison(
        text, brand_positions, overall_score, is_sarcastic
    )
    if comparative_results:
        return comparative_results

    # ── Sub-module 5.2 — Default Attribution (no comparison found) ───────────
    return _default_attribution(detected_brands, overall_sentiment, overall_score, is_sarcastic)


def _detect_comparison(
    text:            str,
    brand_positions: list[dict],
    score:           float,
    is_sarcastic:    bool,
) -> list[BrandSentiment]:
    """
    Sub-module 5.1 — Check for comparative patterns.

    Logic:
        For each comparison pattern found in text:
            Find the brand BEFORE the keyword → assign brand_before_sentiment
            Find the brand AFTER  the keyword → assign brand_after_sentiment

    Returns empty list if no comparison pattern found.
    """
    if len(brand_positions) < 2:
        return []

    for pattern, before_sent, after_sent in COMPARISON_PATTERNS:
        match = pattern.search(text)
        if not match:
            continue

        kw_start = match.start()
        kw_end   = match.end()

        # Brands before the keyword (closest one wins)
        before_brands = [b for b in brand_positions if b["end"] <= kw_start]
        after_brands  = [b for b in brand_positions if b["start"] >= kw_end]

        if not before_brands or not after_brands:
            continue

        brand_before = before_brands[-1]["brand"]  # closest before
        brand_after  = after_brands[0]["brand"]    # closest after

        results = [
            BrandSentiment(
                brand=brand_before, sentiment=before_sent,
                score=score, is_sarcastic=is_sarcastic, method="comparative",
            ),
            BrandSentiment(
                brand=brand_after, sentiment=after_sent,
                score=score, is_sarcastic=is_sarcastic, method="comparative",
            ),
        ]

        # Any other brands in the text get default attribution
        other_brands = [
            b["brand"] for b in brand_positions
            if b["brand"] not in {brand_before, brand_after}
        ]
        for brand in other_brands:
            results.append(BrandSentiment(
                brand=brand, sentiment=before_sent,
                score=score, is_sarcastic=is_sarcastic, method="default",
            ))

        return results

    return []


def _default_attribution(
    brands:       list[str],
    sentiment:    str,
    score:        float,
    is_sarcastic: bool,
) -> list[BrandSentiment]:
    """
    Sub-module 5.2 — Assign overall sentiment to all detected brands.
    Used when no comparison pattern is found.

    Example:
        "I love Nike shoes"  → Nike = positive
        "Nike and Adidas both suck" → Nike = negative, Adidas = negative
    """
    return [
        BrandSentiment(
            brand=brand, sentiment=sentiment,
            score=score, is_sarcastic=is_sarcastic, method="default",
        )
        for brand in brands
    ]


def resolve_conflicts(results: list[BrandSentiment]) -> list[BrandSentiment]:
    """
    Sub-module 5.3 — Conflict Resolver.

    If a brand appears multiple times with different sentiments
    (e.g. from multiple sentences), keep the one with highest confidence.

    Called by api/predict.py after processing all sentences.
    """
    by_brand: dict[str, list[BrandSentiment]] = {}
    for r in results:
        by_brand.setdefault(r.brand, []).append(r)

    resolved = []
    for brand, entries in by_brand.items():
        # Keep highest confidence result
        best = max(entries, key=lambda x: x.score)
        resolved.append(best)
    return resolved
