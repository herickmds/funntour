
from fastapi import APIRouter

from .auth import router as auth
from .users import router as users
from .boats import router as boats
from .locations import router as locations

__all__ = ["auth", "users", "boats", "locations"]
