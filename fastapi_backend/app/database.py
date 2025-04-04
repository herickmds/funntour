from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Obtém a URL do banco de dados das variáveis de ambiente
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/funntour")

# Cria o engine do SQLAlchemy
try:
    engine = create_engine(DATABASE_URL)
    # Testa a conexão
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception as e:
    print(f"Erro ao conectar ao banco de dados: {e}")
    # Fallback para SQLite em memória para desenvolvimento
    DATABASE_URL = "sqlite:///./funntour.db"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

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