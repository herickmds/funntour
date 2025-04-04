# Import all models here for easy access
from app.database import Base
from .user import User
from .location import Country, State, City
from .boat import BoatType, Boat, BoatImage, Route, Marina, boat_routes
from .booking import Booking
from .content import Article, Page, PageSEO
from .itinerary import Itinerary, PartnerPrice