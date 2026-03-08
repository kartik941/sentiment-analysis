from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import csv
from io import StringIO

# -----------------------------
# Initialize FastAPI
# -----------------------------

app = FastAPI(title="Brand Sentiment API")

# -----------------------------
# Enable CORS (allow frontend)
# -----------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # React frontend allowed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Root Endpoint
# -----------------------------

@app.get("/")
def home():
    return {"message": "Backend is running"}

# -----------------------------
# Dashboard Metrics API
# -----------------------------

@app.get("/metrics/{brand}")
def get_metrics(brand: str):
    return {
        "brand": brand,
        "sentiment": {
            "positive": 0.54,
            "neutral": 0.28,
            "negative": 0.18
        }
    }

# -----------------------------
# Text Analysis API
# -----------------------------

class TextInput(BaseModel):
    text: str


@app.post("/predict")
def predict(data: TextInput):

    text = data.text

    # mock sentiment prediction
    sentiment = "Positive"

    return {
        "text": text,
        "brand": "Nike",
        "sentiment": sentiment
    }

# -----------------------------
# CSV Upload API
# -----------------------------

@app.post("/upload-csv")
async def upload_csv(file: UploadFile = File(...)):

    content = await file.read()
    decoded = content.decode("utf-8")

    csv_reader = csv.DictReader(StringIO(decoded))

    results = []

    for row in csv_reader:

        text = row["text"]

        # mock sentiment
        sentiment = "Positive"

        results.append({
            "text": text,
            "sentiment": sentiment
        })

    return {"results": results}