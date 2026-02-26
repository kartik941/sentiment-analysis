from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routes import sentiments
from .routes import analytics
from .routes import alert


app = FastAPI(title="Sentiment Analysis Backend")
app.include_router(sentiments.router,prefix="/api",tags=["sentiments"])
app.include_router(analytics.router,prefix="/api",tags=["analytics"])
app.include_router(alert.router,prefix="/api",tags=["alert"])
# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


models.Base.metadata.create_all(bind=engine)

@app.get("/")
def health_check():
    return {"message": "Backend is running successfully 🚀"}