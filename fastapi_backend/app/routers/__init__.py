
from fastapi import APIRouter

from .auth import router as auth_router
from .users import router as users_router
from .boats import router as boats_router
from .bookings import router as bookings_router
from .locations import router as locations_router

auth = auth_router
users = users_router
boats = boats_router
bookings = bookings_router
locations = locations_router

__all__ = ["auth", "users", "boats", "bookings", "locations"]
