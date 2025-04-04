from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.core.config import get_settings
from datetime import datetime

settings = get_settings()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)  # CPF/CNPJ
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String)
    role = Column(String)  # 'cliente', 'parceiro', 'admin'
    phone = Column(String, nullable=True)  # Optional for Admin
    whatsapp = Column(String, nullable=True)  # Optional for Admin
    birth_date = Column(Date, nullable=True)  # Optional for Admin
    photo_url = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    cep = Column(String)
    address = Column(String)
    recovery_code = Column(String, nullable=True)
    recovery_code_expires = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    boats = relationship("Boat", back_populates="owner")
    bookings = relationship("Booking", back_populates="user")
