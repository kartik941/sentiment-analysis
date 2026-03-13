"""
src/brand/detector.py
MODULE 3 — Brand Detection Module

Identifies which brands are mentioned in each text.
This is what makes the system brand monitoring, not just sentiment analysis.

Implementation: Level 1 — dictionary matching (fast, transparent, no GPU needed)
Future upgrade: spaCy NER / BERT NER for fuzzy matching

Used by: attribution/engine.py, api/predict.py
"""

import re
from typing import Optional


# ── Brand dictionary ──────────────────────────────────────────────────────────
# Keys   = canonical brand name (used in all outputs)
# Values = all surface forms that map to this brand (case-insensitive)

BRAND_ALIASES: dict[str, list[str]] = {
    "Nike":        ["nike", "just do it", "nikerun", "nikesb", "air max",
                    "air force 1", "air jordan", "swoosh", "nike run club"],
    "Adidas":      ["adidas", "yeezy", "ultraboost", "stan smith", "adidas originals",
                    "three stripes"],
    "Puma":        ["puma"],
    "UnderArmour": ["under armour", "underarmour", "ua shoes", "ua gear"],
    "Reebok":      ["reebok"],
    "NewBalance":  ["new balance", "nb shoes"],
    "Asics":       ["asics", "gel-kayano", "gel-nimbus"],
    "Saucony":     ["saucony"],
    "Brooks":      ["brooks running", "brooks shoes"],
    "Hoka":        ["hoka", "hoka one one"],
}

# Pre-compile patterns for speed — whole-word match, case-insensitive
_PATTERNS: dict[str, re.Pattern] = {
    brand: re.compile(
        "|".join(rf"\b{re.escape(alias)}\b" for alias in aliases),
        re.IGNORECASE,
    )
    for brand, aliases in BRAND_ALIASES.items()
}


def detect(text: str) -> list[str]:
    """
    Detect all brands mentioned in text.

    Args:
        text: cleaned text string (run cleaner.clean() first)

    Returns:
        List of canonical brand names found. Empty list if none.
        Order: preserved as found left-to-right in text.

    Example:
        >>> detect("Nike is way better than Puma for running")
        ["Nike", "Puma"]
    """
    if not text:
        return []

    found = []
    for brand, pattern in _PATTERNS.items():
        if pattern.search(text) and brand not in found:
            found.append(brand)
    return found


def detect_with_positions(text: str) -> list[dict]:
    """
    Detect brands with their character positions in text.
    Used by the attribution engine to determine brand order
    in comparative sentences ("Nike is better than Puma").

    Returns:
        List of {"brand": str, "start": int, "end": int, "alias": str}
        Sorted by start position (left to right).

    Example:
        >>> detect_with_positions("Nike beats Puma")
        [
            {"brand": "Nike", "start": 0,  "end": 4,  "alias": "Nike"},
            {"brand": "Puma", "start": 11, "end": 15, "alias": "Puma"},
        ]
    """
    if not text:
        return []

    mentions = []
    for brand, pattern in _PATTERNS.items():
        for match in pattern.finditer(text):
            mentions.append({
                "brand": brand,
                "start": match.start(),
                "end":   match.end(),
                "alias": match.group(),
            })

    return sorted(mentions, key=lambda x: x["start"])


def detect_batch(texts: list[str]) -> list[list[str]]:
    """Detect brands in a list of texts. Returns list of brand lists."""
    return [detect(t) for t in texts]


def is_brand_relevant(text: str, target_brand: Optional[str] = None) -> bool:
    """
    Returns True if text mentions at least one brand.
    If target_brand given, returns True only if that specific brand is mentioned.
    """
    brands = detect(text)
    if target_brand:
        return target_brand in brands
    return len(brands) > 0
