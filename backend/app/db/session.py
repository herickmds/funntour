from sqlalchemy.orm import sessionmaker
from app.db.base import engine, SessionLocal

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
