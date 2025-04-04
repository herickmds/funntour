from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from app.schemas.boat import Boat
from app.schemas.user import User

class BookingBase(BaseModel):
    start_date: datetime
    end_date: datetime
    total_price: float
    status: str

class BookingCreate(BookingBase):
    boat_id: int

class BookingUpdate(BookingBase):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_price: Optional[float] = None
    status: Optional[str] = None

class Booking(BookingBase):
    id: int
    user: User
    boat: Boat
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
