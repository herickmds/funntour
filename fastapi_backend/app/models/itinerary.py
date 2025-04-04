from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.database import Base

class PricingType(str, enum.Enum):
    HOURLY = "hourly"
    DAILY = "daily"

class DayType(str, enum.Enum):
    WEEKDAY = "weekday"
    WEEKEND = "weekend"
    HOLIDAY = "holiday"

class Itinerary(Base):
    __tablename__ = "itineraries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    observations = Column(Text, nullable=True)
    partnerId = Column(Integer, ForeignKey("users.id"))
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    partner = relationship("User")

class PartnerPrice(Base):
    __tablename__ = "partner_prices"

    id = Column(Integer, primary_key=True, index=True)
    boatId = Column(Integer, ForeignKey("boats.id"))
    partnerId = Column(Integer, ForeignKey("users.id"))
    pricingType = Column(String, default=PricingType.HOURLY)
    weekdayMorningPrice = Column(Integer)
    weekdayAfternoonPrice = Column(Integer)
    weekdayNightPrice = Column(Integer)
    weekdayFullDayPrice = Column(Integer)
    weekendMorningPrice = Column(Integer)
    weekendAfternoonPrice = Column(Integer)
    weekendNightPrice = Column(Integer)
    weekendFullDayPrice = Column(Integer)
    holidayMorningPrice = Column(Integer)
    holidayAfternoonPrice = Column(Integer)
    holidayNightPrice = Column(Integer)
    holidayFullDayPrice = Column(Integer)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    boat = relationship("Boat", back_populates="partnerPrices")
    partner = relationship("User")