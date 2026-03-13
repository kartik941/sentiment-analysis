# Brand Sentiment Monitor

> Real-time AI-powered brand sentiment analysis for sportswear brands — Nike, Adidas, Puma, and Reebok. Collects posts from Reddit and news sources every 30 minutes, runs them through four fine-tuned transformer models, and attributes sentiment at the individual brand level.

---

## What It Does

Most sentiment tools score a whole sentence. This system scores **each brand mentioned inside that sentence** — that's the key differentiator.

```
Input:   "Nike is way better than Puma for long distance running"

Standard tool:   overall = neutral

This system:
  overall         = neutral  (0.89)
  brands[0]       = { brand: Nike,  sentiment: positive, method: comparative }
  brands[1]       = { brand: Puma,  sentiment: negative, method: comparative }
  top_emotion     = admiration
  topic           = comfort_cushioning_support
  crisis_flag     = False
```

---

## Table of Contents

- [Architecture](#architecture)
- [ML Models](#ml-models)
- [Project Structure](#project-structure)
- [Quickstart](#quickstart)
  - [Prerequisites](#prerequisites)
  - [1 — Clone & Install](#1--clone--install)
  - [2 — Environment Variables](#2--environment-variables)
  - [3 — Download Model Weights](#3--download-model-weights)
  - [4 — Run the Backend](#4--run-the-backend)
  - [5 — Run the Frontend](#5--run-the-frontend)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Notebooks (Offline Training)](#notebooks-offline-training)
- [ML Pipeline — All 10 Modules](#ml-pipeline--all-10-modules)
- [Performance](#performance)
- [Contributing](#contributing)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1 — DATA SOURCES                                      │
│  Reddit (PRAW)  ──┐                                         │
│                   ├──►  collector.py  (every 30 / 60 min)   │
│  NewsAPI       ──┘                                          │
└────────────────────────────┬────────────────────────────────┘
                             │ raw post text
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2 — ML INFERENCE PIPELINE                             │
│                                                              │
│  clean → detect brands → sentiment → sarcasm →              │
│  attribute → emotion → topic → crisis                        │
│                                                              │
│  Entry point: predict_post()   ~75ms avg per post (CPU)     │
└────────────────────────────┬────────────────────────────────┘
                             │ PredictionResponse JSON
                             ▼
┌──────────────────┐    ┌───────────────┐    ┌───────────────┐
│  FastAPI Backend │    │  Supabase DB  │    │  Next.js UI   │
│  main.py         │◄──►│  live_posts   │◄──►│  Dashboard    │
│  scheduler.py    │    │  predictions  │    │  4 pages      │
│  database.py     │    │  crisis_alerts│    │  5 chart types│
└──────────────────┘    └───────────────┘    └───────────────┘
```

**Data flows every 30 minutes:**

1. `collector.py` fetches new Reddit posts & news articles
2. `predict_post()` runs every new post through all 4 ML models
3. Results saved to Supabase (`live_posts` + `predictions` tables)
4. `aggregator.py` recomputes brand-level metrics (sentiment %, hourly trend, emotion averages, top topics)
5. Crisis detector checks for anomalies — fires Slack alert if severity is high
6. Next.js dashboard auto-refreshes and shows updated charts

---

## ML Models

| Model | Base | Dataset | Metric |
|---|---|---|---|
| **Sentiment** | `cardiffnlp/twitter-roberta-base-sentiment-latest` | Sentiment140 (1.6M tweets) | 84.8% accuracy |
| **Sarcasm** | `roberta-base` | SemEval 2018 Task 3 (~3k tweets) | 69.3% F1 |
| **Emotion** | `monologg/bert-base-cased-goemotions-original` | GoEmotions (58k Reddit comments) | 70.2% macro F1 |
| **Topic** | `sentence-transformers/all-MiniLM-L6-v2` | All training texts combined | 54.77 coherence |

All weights are stored on Google Drive (too large for GitHub — 400–500 MB each in `.safetensors` format).

---

## Project Structure

```
brand-sentiment-monitor/
│
├── notebooks/                        # Offline training (Colab)
│   ├── 00_setup_environment.ipynb    # Install, write src/, create DB schema
│   ├── 01_eda_data_exploration.ipynb # Analyse datasets, write feature_insights.json
│   ├── 02_preprocessing_pipeline.ipynb
│   ├── 03_brand_detection.ipynb
│   ├── 04_sentiment_model.ipynb      # Fine-tune RoBERTa sentiment
│   ├── 05_sarcasm_model.ipynb        # Fine-tune RoBERTa sarcasm
│   ├── 06_attribution_engine.ipynb
│   ├── 07_emotion_model.ipynb        # Fine-tune BERT emotion (28-class)
│   ├── 08_topic_model.ipynb          # Train BERTopic unsupervised
│   └── 09_integration_test.ipynb     # Full pipeline smoke test
│
├── src/                              # ML source code (do not modify)
│   ├── api/
│   │   ├── predict.py                # predict_post() — single ML entry point
│   │   └── schemas.py                # Pydantic models — frozen API contract
│   ├── preprocessing/
│   │   └── cleaner.py                # Module 2 — text cleaning pipeline
│   ├── brand/
│   │   └── detector.py               # Module 3 — brand detection
│   ├── models/
│   │   ├── sentiment.py              # Module 4 — sentiment classifier
│   │   ├── sarcasm.py                # Module 4-sub — irony detector
│   │   ├── emotion.py                # Module 6 — 28-class emotion classifier
│   │   └── topic.py                  # Module 7 — BERTopic wrapper
│   ├── attribution/
│   │   └── engine.py                 # Module 5 — hybrid attribution engine ⭐
│   ├── crisis/
│   │   └── detector.py               # Module 8 — crisis detection
│   ├── aggregation/
│   │   └── aggregator.py             # Module 9 — brand metrics aggregation
│   ├── data/
│   │   └── collector.py              # Live Reddit + NewsAPI collector
│   └── utils/
│       └── logger.py
│
├── models/                           # Model weights (on Drive, not in repo)
│   ├── sentiment/                    # config.json + model.safetensors + tokenizer
│   ├── sarcasm/
│   ├── emotion/
│   └── topic/                        # BERTopic serialized model
│
├── data/                             # Training data (on Drive, not in repo)
│   └── kaggle/raw/
│       ├── sentiment140.csv
│       ├── goemotions.csv
│       └── semeval2018_irony.csv
│
├── outputs/reports/                  # Evaluation JSON files (generated by notebooks)
│
├── main.py                           # FastAPI app — backend creates this
├── scheduler.py                      # APScheduler jobs — backend creates this
├── database.py                       # SQLAlchemy DB layer — backend creates this
│
├── requirements.txt                  # Python dependencies
├── .env.example                      # Environment variable template
├── .gitignore
└── README.md
```

---

## Quickstart

### Prerequisites

- Python 3.10+
- Node.js 18+ (for the frontend)
- A free [Supabase](https://supabase.com) account (PostgreSQL)
- A [Reddit app](https://www.reddit.com/prefs/apps) (script type)
- A [NewsAPI](https://newsapi.org/register) key (free tier)
- Google Drive access to download model weights

---

### 1 — Clone & Install

```bash
git clone https://github.com/your-username/brand-sentiment-monitor.git
cd brand-sentiment-monitor

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install all dependencies
pip install -r requirements.txt

# Download spaCy language model (required separately)
python -m spacy download en_core_web_sm
```

---

### 2 — Environment Variables

Copy the template and fill in your keys:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Reddit API — register at reddit.com/prefs/apps (type: script)
REDDIT_CLIENT_ID=your_client_id_here
REDDIT_CLIENT_SECRET=your_client_secret_here
REDDIT_USER_AGENT=BrandSentimentMonitor/1.0 by YourRedditUsername

# NewsAPI — register free at newsapi.org/register
NEWSAPI_KEY=your_newsapi_key_here

# Supabase — get from supabase.com → project settings → database
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
DATABASE_URL=postgresql://postgres:password@db.your-project-ref.supabase.co:5432/postgres

# Optional — Slack crisis alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url

# Absolute path to this project folder
DRIVE_ROOT=/absolute/path/to/brand-sentiment-monitor
```

> **Never commit `.env` to git.** It is already in `.gitignore`.

---

### 3 — Download Model Weights

Model weights live on Google Drive (not in this repo — each file is 400–500 MB).

Ask the ML engineer for the Drive share link, then download and place the folders at:

```
brand-sentiment-monitor/
  models/
    sentiment/     ← place here
    sarcasm/       ← place here
    emotion/       ← place here
    topic/         ← place here
```

Verify models load correctly:

```bash
python -c "
import os
os.environ['DRIVE_ROOT'] = os.getcwd()
from src.api.predict import predict_post
result = predict_post('Nike just dropped an amazing new shoe', platform='reddit')
print('Status: OK')
print('Brands:', [b.brand for b in result.brands])
print('Sentiment:', result.overall.label)
"
```

---

### 4 — Run the Backend

The backend engineer must first create three files — `main.py`, `scheduler.py`, and `database.py`. See the [Architecture document](ARCHITECTURE.docx) for the full specification.

Once created:

```bash
# Development
uvicorn main:app --reload --port 8000

# Production
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

Check it's running:

```bash
curl http://localhost:8000/health
# {"status": "ok"}
```

---

### 5 — Run the Frontend

```bash
# Create the Next.js project (first time only)
npx create-next-app@latest brand-sentiment-frontend \
  --typescript --tailwind --app --src-dir

cd brand-sentiment-frontend

# Install additional dependencies
npm install recharts @tanstack/react-query axios date-fns lucide-react
npx shadcn-ui@latest init

# Set backend URL
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

Dashboard available at `http://localhost:3000`

---

## API Endpoints

All endpoints served by FastAPI at `http://localhost:8000`.

| Method | Endpoint | Description | Returns |
|---|---|---|---|
| `GET` | `/health` | Connection check | `{"status": "ok"}` |
| `POST` | `/predict` | Run ML pipeline on text | `PredictionResponse` |
| `GET` | `/metrics` | Brand metrics for all brands | `BrandMetrics[]` |
| `GET` | `/metrics/{brand}` | Brand metrics for one brand | `BrandMetrics` |
| `GET` | `/competitive` | Cross-brand comparison | `CompetitiveSnapshot` |
| `GET` | `/alerts` | Crisis alerts (`?resolved=false`) | `CrisisAlert[]` |
| `PUT` | `/alerts/{id}/resolve` | Mark alert as resolved | Updated alert |
| `GET` | `/posts/{brand}` | Recent posts (`?limit=20`) | `PredictionResponse[]` |

### Example — POST /predict

```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "Oh great, my Reebok shoes broke on day one. Love the quality.", "platform": "reddit"}'
```

```json
{
  "text": "Oh great, my Reebok shoes broke on day one. Love the quality.",
  "platform": "reddit",
  "overall": {
    "label": "negative",
    "score": 0.51,
    "is_sarcastic": true,
    "sarcasm_score": 0.87
  },
  "brands": [
    { "brand": "Reebok", "sentiment": "negative", "score": 0.51, "method": "default" }
  ],
  "emotions": {
    "emotions": { "anger": 0.71, "disappointment": 0.65, "annoyance": 0.42 },
    "top_emotion": "anger"
  },
  "topic": {
    "topic_id": 3,
    "label": "sole_durability_quality",
    "keywords": ["broke", "fell", "apart", "quality", "sole"]
  },
  "crisis": {
    "crisis_flag": true,
    "severity": "medium"
  },
  "processed_at": "2026-03-13T10:24:00Z"
}
```

### Example — GET /metrics/Nike

```bash
curl http://localhost:8000/metrics/Nike
```

```json
{
  "brand": "Nike",
  "posts": 1240,
  "computed_at": "2026-03-13T10:00:00Z",
  "sentiment_dist": { "positive": 0.62, "neutral": 0.18, "negative": 0.20 },
  "hourly_trend": [
    { "hour": "2026-03-12T10:00:00Z", "positive_pct": 0.71 },
    { "hour": "2026-03-12T11:00:00Z", "positive_pct": 0.68 }
  ],
  "emotion_avgs": { "admiration": 0.34, "joy": 0.28, "anger": 0.12 },
  "top_topics": [
    { "topic": "comfort_cushioning_support", "count": 142 },
    { "topic": "sole_durability_quality",    "count": 98 }
  ],
  "crisis_posts": 12,
  "negative_pct": 0.20
}
```

---

## Database Schema

Three tables in Supabase (PostgreSQL). Created automatically by notebook 00 when `DATABASE_URL` is configured.

```sql
-- Raw collected posts (before ML processing)
CREATE TABLE live_posts (
    id           TEXT PRIMARY KEY,           -- Reddit/NewsAPI post ID
    platform     VARCHAR(20) NOT NULL,       -- 'reddit' | 'news'
    type         VARCHAR(30),                -- 'post' | 'comment' | 'article'
    brand        VARCHAR(100),               -- brand this post was collected for
    full_text    TEXT,                       -- raw uncleaned text
    url          TEXT,
    author       TEXT,
    score        INTEGER,                    -- Reddit upvote score (null for news)
    created_utc  TIMESTAMPTZ,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    metadata     JSONB
);

-- ML prediction results (one row per brand per post)
CREATE TABLE predictions (
    id              BIGSERIAL PRIMARY KEY,
    post_id         TEXT REFERENCES live_posts(id) ON DELETE CASCADE,
    brand           VARCHAR(100),
    sentiment       VARCHAR(20),             -- 'positive' | 'neutral' | 'negative'
    sentiment_score FLOAT,                   -- confidence 0.0-1.0
    is_sarcastic    BOOLEAN,
    sarcasm_score   FLOAT,
    emotions        JSONB,                   -- {"anger": 0.71, "joy": 0.12, ...}
    topic_id        INTEGER,                 -- -1 = outlier
    topic_label     TEXT,                    -- e.g. "sole_durability_quality"
    crisis_flag     BOOLEAN DEFAULT FALSE,
    predicted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Crisis alerts (persists until resolved)
CREATE TABLE crisis_alerts (
    id           BIGSERIAL PRIMARY KEY,
    brand        VARCHAR(100),
    alert_type   VARCHAR(50),               -- 'negative_volume' | 'anger_spike' | 'isolation_forest'
    severity     VARCHAR(20),               -- 'low' | 'medium' | 'high'
    message      TEXT,
    z_score      FLOAT,
    triggered_at TIMESTAMPTZ DEFAULT NOW(),
    resolved     BOOLEAN DEFAULT FALSE
);
```

---

## Notebooks (Offline Training)

Run notebooks sequentially in Google Colab. Mount Google Drive first. Each notebook saves its outputs to Drive and is a prerequisite for the next.

| # | Notebook | Input | Output |
|---|---|---|---|
| 00 | `00_setup_environment` | — | `src/` directory, `.env`, DB tables |
| 01 | `01_eda_data_exploration` | 3 Kaggle CSVs | `feature_insights.json`, `eda_metadata.json` |
| 02 | `02_preprocessing_pipeline` | Raw CSVs + feature_insights | Processed CSVs |
| 03 | `03_brand_detection` | Processed CSVs | `brand_eval.json` |
| 04 | `04_sentiment_model` | Sentiment140 | `models/sentiment/` weights |
| 05 | `05_sarcasm_model` | SemEval 2018 Task 3 | `models/sarcasm/` weights |
| 06 | `06_attribution_engine` | sentiment + sarcasm models | `attribution_eval.json` |
| 07 | `07_emotion_model` | GoEmotions (58k) | `models/emotion/` weights |
| 08 | `08_topic_model` | All texts combined | `models/topic/` saved model |
| 09 | `09_integration_test` | All 4 models | `integration_report.json` — STATUS: READY ✅ |

**Kaggle datasets required for training** (download and upload to Drive before running nb01):

| Dataset | Kaggle page | Rename to |
|---|---|---|
| Sentiment140 | [kazanova/sentiment140](https://www.kaggle.com/datasets/kazanova/sentiment140) | `sentiment140.csv` |
| GoEmotions | [google/goemotions](https://www.kaggle.com/datasets/google/goemotions) | `goemotions.csv` |
| SemEval 2018 Task 3 | [search SemEval 2018 Task 3](https://www.kaggle.com/search?q=semeval+2018+irony) | `semeval2018_irony.csv` |

---

## ML Pipeline — All 10 Modules

Every prediction runs through this exact sequence inside `predict_post()`:

```
Module 2  →  cleaner.clean()               Remove URLs, @mentions, normalise text
Module 3  →  brand.detect()               Find Nike / Adidas / Puma / Reebok in text
Module 4  →  sentiment.predict()          3-class sentiment: positive / neutral / negative
Module 4s →  sarcasm.predict()            Binary irony detection (flips sentiment if True)
Module 5  →  attribution.attribute()      ⭐ Per-brand sentiment (the key differentiator)
Module 6  →  emotion.predict()            28-class multi-label emotion scores
Module 7  →  topic.predict()              Unsupervised topic assignment (BERTopic)
Module 8  →  crisis.check_thresholds()    Anomaly detection → crisis alert if triggered
Module 9  →  aggregator.aggregate()       Batch: compute brand-level dashboard metrics
Module 10 →  predict_post() / schemas.py  Entry point + frozen API contract
```

**Module 5 — Attribution Engine** is what makes this system brand monitoring rather than generic sentiment analysis. It contains three sub-modules:

- **5.1 Comparative Detector** — `"Nike is better than Puma"` → Nike=positive, Puma=negative
- **5.2 Default Attribution** — overall sentiment + sarcasm flip → attributed to all detected brands
- **5.3 Conflict Resolver** — if a brand gets mixed signals, highest-confidence result wins

---

## Performance

| Metric | Value |
|---|---|
| Collection schedule | Reddit: every 30 min · NewsAPI: every 60 min |
| Pipeline latency | ~75ms per post (CPU, all 4 models loaded) |
| Sentiment accuracy | 84.8% (3-class, Sentiment140 test set) |
| Sarcasm F1 | 69.3% (binary, SemEval 2018 — human ceiling ~78%) |
| Emotion macro F1 | 70.2% (28-class multi-label, GoEmotions) |
| Topic coherence | 54.77 (BERTopic, informational only) |
| Integration test | 5/5 smoke tests passed · STATUS = READY |
| Brands monitored | Nike · Adidas · Puma · Reebok |

---

## Contributing

This project is divided across three roles. **Do not modify files outside your area.**

| Role | Files You Own | Files That Are Read-Only For You |
|---|---|---|
| **ML Engineer** | `notebooks/`, `src/` | `main.py`, `scheduler.py`, `database.py` |
| **Backend Engineer** | `main.py`, `scheduler.py`, `database.py`, `.env` | Everything in `src/` |
| **Frontend Engineer** | `brand-sentiment-frontend/` | Everything in `src/` and all backend files |

**The `src/api/schemas.py` contract is frozen.** Field names, types, and required fields cannot change after backend handoff. Internal model improvements are fine.

---

## Key Files Quick Reference

| File | What It Is |
|---|---|
| `src/api/predict.py` | The only ML function the backend ever calls: `predict_post()` |
| `src/api/schemas.py` | All Pydantic response models — the API contract |
| `src/attribution/engine.py` | The brand attribution engine — the core differentiator |
| `requirements.txt` | All Python dependencies — `pip install -r requirements.txt` |
| `.env.example` | Template for all required environment variables |
| `ARCHITECTURE.docx` | Complete system architecture & module reference document |
| `FRONTEND_HANDOFF.docx` | Full frontend specification for the Next.js dashboard |

---

## License

Internal project — not for public distribution.
