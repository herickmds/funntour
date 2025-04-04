from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class BookingStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    COMPLETED = "completed"

class PeriodType(str, Enum):
    MORNING = "morning"
    AFTERNOON = "afternoon"
    NIGHT = "night"
    FULLDAY = "fullday"

class BookingBase(BaseModel):
    userId: int
    boatId: int
    routeId: int
    marinaId: int
    startDateTime: datetime
    endDateTime: datetime
    period: PeriodType
    totalPrice: float
    notes: Optional[str] = None

class BookingCreate(BookingBase):
    pass

class BookingUpdate(BaseModel):
    startDateTime: Optional[datetime] = None
    endDateTime: Optional[datetime] = None
    period: Optional[PeriodType] = None
    totalPrice: Optional[float] = None
    notes: Optional[str] = None

class BookingStatusUpdate(BaseModel):
    status: BookingStatus

class Booking(BookingBase):
    id: int
    status: BookingStatus
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

# Esquema para retorno com relacionamentos
class BookingDetail(Booking):
    boat: Optional[dict] = None  # Dados simplificados do barco
    route: Optional[dict] = None  # Dados simplificados da rota
    marina: Optional[dict] = None  # Dados simplificados da marina
    user: Optional[dict] = None  # Dados básicos do usuário (sem senha)