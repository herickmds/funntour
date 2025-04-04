from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.schemas.user import User
from app.schemas.boat import Boat

class PartnerPriceBase(BaseModel):
    price: float
    start_date: datetime
    end_date: datetime

class PartnerPriceCreate(PartnerPriceBase):
    partner_id: int
    boat_id: int

class PartnerPriceUpdate(PartnerPriceBase):
    price: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class PartnerPrice(PartnerPriceBase):
    id: int
    partner: User
    boat: Boat
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
