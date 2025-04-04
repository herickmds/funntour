from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums e tipos auxiliares
class FuelType(str, Enum):
    GASOLINE = "gasoline"
    DIESEL = "diesel"
    ELECTRIC = "electric"
    HYBRID = "hybrid"

class BoatStatus(str, Enum):
    AVAILABLE = "available"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"

class Prices(BaseModel):
    morning: float
    afternoon: float
    night: float
    fullDay: float

# Esquemas para BoatType
class BoatTypeBase(BaseModel):
    name: str
    description: Optional[str] = None

class BoatTypeCreate(BoatTypeBase):
    pass

class BoatTypeUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class BoatType(BoatTypeBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

# Esquemas para Marina
class MarinaBase(BaseModel):
    name: str
    address: str
    cityId: int
    contactName: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None

class MarinaCreate(MarinaBase):
    pass

class MarinaUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    cityId: Optional[int] = None
    contactName: Optional[str] = None
    contactPhone: Optional[str] = None
    contactEmail: Optional[str] = None

class Marina(MarinaBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

# Esquemas para Route
class RouteBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration: float
    price: Optional[float] = None

class RouteCreate(RouteBase):
    pass

class RouteUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[float] = None
    price: Optional[float] = None

class Route(RouteBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

# Esquemas para BoatRoute
class BoatRouteBase(BaseModel):
    boatId: int
    routeId: int
    weekdayPrices: Prices
    weekendPrices: Prices
    holidayPrices: Prices

class BoatRouteCreate(BoatRouteBase):
    pass

class BoatRoute(BoatRouteBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class BoatRouteWithRoute(BoatRoute):
    route: Route

# Esquemas para BoatImage
class BoatImageBase(BaseModel):
    boatId: int
    imageUrl: str
    order: Optional[int] = 0

class BoatImageCreate(BoatImageBase):
    pass

class BoatImage(BoatImageBase):
    id: int
    createdAt: datetime

    class Config:
        orm_mode = True

# Esquemas para Boat
class BoatBase(BaseModel):
    name: str
    boatTypeId: int
    capacity: int
    length: float
    manufacturingYear: Optional[int] = None
    motorPower: Optional[str] = None
    fuelType: Optional[FuelType] = None
    hasToilet: bool = False
    hasBathroom: bool = False
    hasKitchen: bool = False
    hasAirConditioner: bool = False
    hasSoundSystem: bool = False
    hasLifeJacket: bool = False
    status: BoatStatus = BoatStatus.AVAILABLE
    mainImageUrl: Optional[str] = None
    description: Optional[str] = None
    marinaId: Optional[int] = None

class BoatCreate(BoatBase):
    pass

class BoatUpdate(BaseModel):
    name: Optional[str] = None
    boatTypeId: Optional[int] = None
    capacity: Optional[int] = None
    length: Optional[float] = None
    manufacturingYear: Optional[int] = None
    motorPower: Optional[str] = None
    fuelType: Optional[FuelType] = None
    hasToilet: Optional[bool] = None
    hasBathroom: Optional[bool] = None
    hasKitchen: Optional[bool] = None
    hasAirConditioner: Optional[bool] = None
    hasSoundSystem: Optional[bool] = None
    hasLifeJacket: Optional[bool] = None
    status: Optional[BoatStatus] = None
    mainImageUrl: Optional[str] = None
    description: Optional[str] = None
    marinaId: Optional[int] = None

class Boat(BoatBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class BoatDetail(Boat):
    boatType: BoatType
    marina: Optional[Marina] = None
    images: List[BoatImage] = []