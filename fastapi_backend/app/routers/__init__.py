from .auth import router as auth
from .users import router as users
from .boats import router as boats
from .bookings import router as bookings
from .content import router as content
from .locations import router as locations

__all__ = ["auth", "users", "boats", "content", "locations", "bookings"]