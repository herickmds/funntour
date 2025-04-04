from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Obtém a URL do banco de dados a partir das variáveis de ambiente ou usa um valor padrão
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/funn_tour")

# Cria o engine do SQLAlchemy
engine = create_engine(DATABASE_URL)

# Cria uma sessão local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Classe base para todos os modelos
Base = declarative_base()

# Dependência para obter a sessão do banco de dados
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()