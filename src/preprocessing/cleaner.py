"""
src/preprocessing/cleaner.py
MODULE 2 — Text Preprocessing Pipeline

Converts raw social text into model-ready clean text.
Used by: notebook 02, brand/detector.py, models/sentiment.py

Rule: minimal cleaning for BERT — do NOT over-clean.
BERT understands punctuation, casing, and context.
Only remove things that add zero signal (URLs, @mentions).
"""

import re
import emoji
import contractions


def clean(text: str, platform: str = "reddit") -> str:
    """
    Main cleaning function. Called on every text before any model sees it.

    Steps (in order):
        1. Decode unicode
        2. Remove URLs
        3. Remove @mentions
        4. Convert emojis to text tokens  e.g. ?? → :enraged_face:
        5. Expand contractions           e.g. don't → do not
        6. Normalize repeated chars      e.g. loooove → love
        7. Collapse whitespace
        8. Strip

    NOT done (intentional):
        - Lowercase  → BERT is cased, ALL CAPS carries sentiment signal
        - Stopwords  → BERT needs full context
        - Lemmatize  → BERT handles morphology internally
        - Hashtags   → keep text, only strip # symbol

    Args:
        text:     raw input string
        platform: "reddit" | "news" | "twitter" — reserved for future
                  platform-specific rules

    Returns:
        cleaned string, minimum 0 chars
    """
    if not isinstance(text, str) or not text.strip():
        return ""

    text = text.encode("utf-8", errors="ignore").decode("utf-8")
    text = re.sub(r"https?://\S+",  "", text)          # URLs
    text = re.sub(r"@\w+",          "", text)           # @mentions
    text = re.sub(r"#(\w+)",        r"\1", text)        # #hashtag → hashtag
    text = emoji.demojize(text, delimiters=(" :", ": "))# ?? → :enraged_face:
    text = contractions.fix(text)                       # don't → do not
    text = re.sub(r"(.)\1{2,}",     r"\1\1", text)     # loooove → loove
    text = re.sub(r"\s+",           " ",     text)
    return text.strip()


def is_valid(text: str, min_len: int = 15) -> bool:
    """
    Returns True if text is worth processing.
    Filters out near-empty posts after cleaning.
    """
    return isinstance(text, str) and len(text.strip()) >= min_len


def clean_batch(texts: list[str], platform: str = "reddit") -> list[str]:
    """Clean a list of texts. Returns list of same length (empty string for invalid)."""
    return [clean(t, platform) for t in texts]
