from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from . import models
from .routes import predict
from .routes import metrics
from .routes import alert


app = FastAPI(title="Sentiment Analysis Backend")
app.include_router(predict.router,prefix="/api",tags=["predict"])
app.include_router(metrics.router,prefix="/api",tags=["metrics"])
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