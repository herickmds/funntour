from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class PricingType(str, Enum):
    HOURLY = "hourly"
    DAILY = "daily"

class DayType(str, Enum):
    WEEKDAY = "weekday"
    WEEKEND = "weekend"
    HOLIDAY = "holiday"

# Esquemas para Itinerary
class ItineraryBase(BaseModel):
    name: str
    description: Optional[str] = None
    observations: Optional[str] = None
    partnerId: int

class ItineraryCreate(ItineraryBase):
    pass

class ItineraryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    observations: Optional[str] = None

class Itinerary(ItineraryBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class ItineraryWithPartner(Itinerary):
    partner: dict  # Dados básicos do parceiro

# Esquemas para PartnerPrice
class PartnerPriceBase(BaseModel):
    boatId: int
    partnerId: int
    pricingType: PricingType = PricingType.HOURLY
    weekdayMorningPrice: int
    weekdayAfternoonPrice: int
    weekdayNightPrice: int
    weekdayFullDayPrice: int
    weekendMorningPrice: int
    weekendAfternoonPrice: int
    weekendNightPrice: int
    weekendFullDayPrice: int
    holidayMorningPrice: int
    holidayAfternoonPrice: int
    holidayNightPrice: int
    holidayFullDayPrice: int

class PartnerPriceCreate(PartnerPriceBase):
    pass

class PartnerPriceUpdate(BaseModel):
    pricingType: Optional[PricingType] = None
    weekdayMorningPrice: Optional[int] = None
    weekdayAfternoonPrice: Optional[int] = None
    weekdayNightPrice: Optional[int] = None
    weekdayFullDayPrice: Optional[int] = None
    weekendMorningPrice: Optional[int] = None
    weekendAfternoonPrice: Optional[int] = None
    weekendNightPrice: Optional[int] = None
    weekendFullDayPrice: Optional[int] = None
    holidayMorningPrice: Optional[int] = None
    holidayAfternoonPrice: Optional[int] = None
    holidayNightPrice: Optional[int] = None
    holidayFullDayPrice: Optional[int] = None

class PartnerPrice(PartnerPriceBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class PartnerPriceWithDetails(PartnerPrice):
    boat: dict  # Dados simplificados do barco
    partner: dict  # Dados básicos do parceiro