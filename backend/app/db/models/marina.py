from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.db.base import Base

class Marina(Base):
    __tablename__ = "marinas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String)
    contact_phone = Column(String)
    contact_email = Column(String)
    services = Column(String)  # JSON string com serviços oferecidos
    
    # Relacionamentos
    boats = relationship("Boat", back_populates="marina")
    
    # Campos de imagem
    main_image_url = Column(String)
    gallery_images = Column(String)  # JSON string com URLs das imagens
