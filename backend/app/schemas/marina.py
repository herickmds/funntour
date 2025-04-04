from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime
from app.schemas.boat import Boat

class MarinaBase(BaseModel):
    name: str
    description: str
    latitude: float
    longitude: float
    address: str
    contact_phone: str
    contact_email: str
    services: List[str]
    main_image_url: Optional[HttpUrl] = None
    gallery_images: Optional[List[HttpUrl]] = None

class MarinaCreate(MarinaBase):
    pass

class MarinaUpdate(MarinaBase):
    name: Optional[str] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    services: Optional[List[str]] = None
    main_image_url: Optional[HttpUrl] = None
    gallery_images: Optional[List[HttpUrl]] = None

class Marina(MarinaBase):
    id: int
    boats: List[Boat]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
