from app.db.base import Base
from app.db.session import engine
from app.db.models import user  # Import all models

def init_db():
    Base.metadata.create_all(bind=engine)
    print("Database initialized successfully!")

if __name__ == "__main__":
    init_db()
