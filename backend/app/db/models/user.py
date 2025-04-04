from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.core.config import get_settings

settings = get_settings()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # admin, parceiro, etc
    photo_url = Column(String)
    is_active = Column(Boolean, default=True)

    # Relationships
    boats = relationship("Boat", back_populates="owner")
    bookings = relationship("Booking", back_populates="user")
