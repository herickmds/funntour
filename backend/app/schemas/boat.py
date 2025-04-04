from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class BoatBase(BaseModel):
    name: str
    description: str
    capacity: int
    price_per_day: float
    is_available: bool = True
    main_image_url: Optional[HttpUrl] = None
    gallery_images: Optional[List[HttpUrl]] = None

class BoatCreate(BoatBase):
    owner_id: int

class BoatUpdate(BoatBase):
    name: Optional[str] = None
    description: Optional[str] = None
    capacity: Optional[int] = None
    price_per_day: Optional[float] = None
    is_available: Optional[bool] = None
    main_image_url: Optional[HttpUrl] = None
    gallery_images: Optional[List[HttpUrl]] = None

class Boat(BoatBase):
    id: int
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
