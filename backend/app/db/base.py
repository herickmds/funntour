from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Importar todos os modelos para garantir que sejam criados
from app.db.models.user import User
from app.db.models.boat import Boat
from app.db.models.marina import Marina
from app.db.models.booking import Booking
from app.db.models.partner_price import PartnerPrice

# Criar todas as tabelas
Base.metadata.create_all(bind=engine)
