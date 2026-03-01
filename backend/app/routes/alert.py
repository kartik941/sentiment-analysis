from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import CrisisAlert

router = APIRouter()

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db)):

    alerts = (
        db.query(CrisisAlert)
        .order_by(CrisisAlert.triggered_at.desc())
        .all()
    )

    return alerts