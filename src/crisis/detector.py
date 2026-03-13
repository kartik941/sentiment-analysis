"""
src/crisis/detector.py
MODULE 8 — Crisis Detection Engine

Monitors aggregated brand sentiment over time and fires alerts
when anomalies are detected.

Two detection methods:
    1. Rule-based threshold  — fast, transparent, always-on
       "negative ratio > 40% in last 1 hour → ALERT"

    2. Isolation Forest      — statistical anomaly detection
       Flags spikes that are unusual relative to 7-day baseline

Business value:
    "Your team gets a Slack alert before Twitter does."

Called by: aggregation/aggregator.py (every collection cycle)
Output:    crisis_alerts table in Supabase
"""

from __future__ import annotations
import numpy as np
from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass
class CrisisAlert:
    brand:        str
    severity:     str        # "low" | "medium" | "high"
    trigger:      str        # what fired the alert
    message:      str
    negative_pct: float
    z_score:      float
    window_posts: int
    triggered_at: str


# ── Thresholds (from config.yaml crisis_detection section) ───────────────────
NEGATIVE_THRESHOLD = 0.40    # >40% negative in window → alert
ANGER_THRESHOLD    = 0.65    # anger emotion avg > 0.65 → alert
Z_SCORE_LOW        = 2.0
Z_SCORE_MEDIUM     = 3.0
Z_SCORE_HIGH       = 4.0


def check_thresholds(
    brand:           str,
    sentiments:      list[str],        # list of "positive"|"neutral"|"negative"
    emotion_avgs:    dict[str, float], # {"anger": 0.4, "joy": 0.1, ...}
    baseline_neg_pct: float,           # 7-day baseline negative %
    baseline_std:     float,           # 7-day std dev
) -> list[CrisisAlert]:
    """
    Rule-based threshold checker. Fast, runs every 30 min.

    Args:
        brand:            brand name being checked
        sentiments:       all sentiment labels in current window (1 hour)
        emotion_avgs:     average emotion scores in current window
        baseline_neg_pct: 7-day average negative percentage
        baseline_std:     7-day standard deviation of negative percentage

    Returns:
        List of CrisisAlert (empty = no crisis)
    """
    if not sentiments:
        return []

    alerts = []
    n = len(sentiments)
    neg_count = sentiments.count("negative")
    neg_pct   = neg_count / n

    # ── Rule 1: Negative volume threshold ────────────────────────────────────
    if neg_pct > NEGATIVE_THRESHOLD:
        z = (neg_pct - baseline_neg_pct) / (baseline_std + 1e-9)
        severity = _severity(z)
        alerts.append(CrisisAlert(
            brand=brand,
            severity=severity,
            trigger="negative_volume_threshold",
            message=(
                f"{neg_pct*100:.0f}% of last {n} posts are negative "
                f"(baseline {baseline_neg_pct*100:.0f}%, z={z:.1f})"
            ),
            negative_pct=round(neg_pct, 4),
            z_score=round(z, 2),
            window_posts=n,
            triggered_at=datetime.now(timezone.utc).isoformat(),
        ))

    # ── Rule 2: Anger spike ───────────────────────────────────────────────────
    anger_avg = emotion_avgs.get("anger", 0.0)
    if anger_avg > ANGER_THRESHOLD:
        alerts.append(CrisisAlert(
            brand=brand,
            severity="medium",
            trigger="anger_spike",
            message=f"Anger emotion avg = {anger_avg:.2f} (threshold {ANGER_THRESHOLD})",
            negative_pct=round(neg_pct, 4),
            z_score=0.0,
            window_posts=n,
            triggered_at=datetime.now(timezone.utc).isoformat(),
        ))

    return alerts


def isolation_forest_check(
    brand:           str,
    window_features: list[float],  # [neg_pct, anger_avg, volume_delta]
    baseline_matrix: list[list[float]],  # 7 days of same features
) -> list[CrisisAlert]:
    """
    Statistical anomaly detection using Isolation Forest.
    More sensitive than thresholds — catches subtle unusual patterns.

    Args:
        window_features:  feature vector for current 1-hour window
        baseline_matrix:  feature vectors from past 7 days (rows = hours)

    Returns:
        List of CrisisAlert if anomaly detected, else empty list.
    """
    from sklearn.ensemble import IsolationForest

    if len(baseline_matrix) < 24:   # need at least 24 hours of history
        return []

    X = np.array(baseline_matrix)
    clf = IsolationForest(contamination=0.05, n_estimators=100, random_state=42)
    clf.fit(X)

    score    = clf.decision_function([window_features])[0]
    is_anomaly = clf.predict([window_features])[0] == -1

    if not is_anomaly:
        return []

    neg_pct = window_features[0]
    return [CrisisAlert(
        brand=brand,
        severity="medium",
        trigger="isolation_forest_anomaly",
        message=f"Statistical anomaly detected (score={score:.3f})",
        negative_pct=round(neg_pct, 4),
        z_score=round(float(-score), 2),
        window_posts=0,
        triggered_at=datetime.now(timezone.utc).isoformat(),
    )]


def _severity(z_score: float) -> str:
    if z_score >= Z_SCORE_HIGH:   return "high"
    if z_score >= Z_SCORE_MEDIUM: return "medium"
    return "low"
