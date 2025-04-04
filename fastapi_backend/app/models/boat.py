from sqlalchemy import Boolean, Column, Integer, String, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# Tabela de associação entre barcos e rotas
boat_routes = Table(
    "boat_routes",
    Base.metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("boatId", Integer, ForeignKey("boats.id", ondelete="CASCADE")),
    Column("routeId", Integer, ForeignKey("routes.id", ondelete="CASCADE")),
    Column("weekdayPrices", String),  # JSON string para os preços de dias de semana
    Column("weekendPrices", String),  # JSON string para os preços de fins de semana
    Column("holidayPrices", String),  # JSON string para os preços de feriados
    Column("createdAt", DateTime(timezone=True), server_default=func.now()),
    Column("updatedAt", DateTime(timezone=True), onupdate=func.now())
)

class BoatType(Base):
    __tablename__ = "boat_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    boats = relationship("Boat", back_populates="boatType")

class Boat(Base):
    __tablename__ = "boats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    boatTypeId = Column(Integer, ForeignKey("boat_types.id"))
    capacity = Column(Integer)
    length = Column(Float)
    manufacturingYear = Column(Integer, nullable=True)
    motorPower = Column(String, nullable=True)
    fuelType = Column(String, nullable=True)
    hasToilet = Column(Boolean, default=False)
    hasBathroom = Column(Boolean, default=False)
    hasKitchen = Column(Boolean, default=False)
    hasAirConditioner = Column(Boolean, default=False)
    hasSoundSystem = Column(Boolean, default=False)
    hasLifeJacket = Column(Boolean, default=False)
    status = Column(String, default="available")  # available, maintenance, inactive
    mainImageUrl = Column(String, nullable=True)  # URL da imagem principal
    description = Column(String, nullable=True)
    marinaId = Column(Integer, ForeignKey("marinas.id"), nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    boatType = relationship("BoatType", back_populates="boats")
    marina = relationship("Marina", back_populates="boats")
    images = relationship("BoatImage", back_populates="boat", cascade="all, delete-orphan")
    routes = relationship("Route", secondary=boat_routes, back_populates="boats")
    bookings = relationship("Booking", back_populates="boat", cascade="all, delete-orphan")
    partnerPrices = relationship("PartnerPrice", back_populates="boat", cascade="all, delete-orphan")

class BoatImage(Base):
    __tablename__ = "boat_images"

    id = Column(Integer, primary_key=True, index=True)
    boatId = Column(Integer, ForeignKey("boats.id", ondelete="CASCADE"))
    imageUrl = Column(String)
    order = Column(Integer, default=0)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())

    boat = relationship("Boat", back_populates="images")

class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String, nullable=True)
    duration = Column(Float)  # Duração em horas
    price = Column(Float, nullable=True)  # Preço base
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    boats = relationship("Boat", secondary=boat_routes, back_populates="routes")
    bookings = relationship("Booking", back_populates="route")

class Marina(Base):
    __tablename__ = "marinas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    address = Column(String)
    cityId = Column(Integer, ForeignKey("cities.id"))
    contactName = Column(String, nullable=True)
    contactPhone = Column(String, nullable=True)
    contactEmail = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())

    boats = relationship("Boat", back_populates="marina")
    city = relationship("City")
    bookings = relationship("Booking", back_populates="marina")