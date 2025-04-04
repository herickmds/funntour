from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.models.user import User
from app.db.models.boat import Boat

class PartnerPrice(Base):
    __tablename__ = "partner_prices"

    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(Integer, ForeignKey("users.id"))
    boat_id = Column(Integer, ForeignKey("boats.id"))
    price = Column(Float)
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    
    # Relacionamentos
    partner = relationship("User", back_populates="partner_prices")
    boat = relationship("Boat", back_populates="partner_prices")
