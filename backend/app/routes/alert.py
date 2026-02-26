from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import session
from ..database import get_db
from ..models import Post

router  = APIRouter()

@router.get("/crisis")
def get_crisis_posts(db: session = Depends(get_db)):
    posts = (
        db.query(Post)
        .filter(Post.crisis_flag==True)
        .order_by(Post.created_at.desc())
        .all()
    )
    return posts
    