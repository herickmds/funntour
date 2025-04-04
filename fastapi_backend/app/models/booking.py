from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed" 
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    userId = Column(Integer, ForeignKey("users.id"))
    boatId = Column(Integer, ForeignKey("boats.id"))
    routeId = Column(Integer, ForeignKey("routes.id"))
    marinaId = Column(Integer, ForeignKey("marinas.id"))
    startDateTime = Column(DateTime(timezone=True))
    endDateTime = Column(DateTime(timezone=True))
    period = Column(String)  # morning, afternoon, night, fullday
    totalPrice = Column(Float)
    status = Column(String, default=BookingStatus.PENDING)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User")
    boat = relationship("Boat", back_populates="bookings")
    route = relationship("Route", back_populates="bookings")
    marina = relationship("Marina", back_populates="bookings")