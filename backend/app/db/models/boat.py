from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base
from app.db.models.user import User
from app.db.models.marina import Marina


class Boat(Base):
    __tablename__ = "boats"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    capacity = Column(Integer)
    price_per_day = Column(Float)
    is_available = Column(Boolean, default=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    marina_id = Column(Integer, ForeignKey("marinas.id"))
    
    # Relacionamentos
    owner = relationship("User", back_populates="boats")
    marina = relationship("Marina", back_populates="boats")
    bookings = relationship("Booking", back_populates="boat")
    
    # Campos de imagem
    main_image_url = Column(String)
    gallery_images = Column(String)  # JSON string com URLs das imagens
