from app.db.session import engine
from app.db.models import user  # Import all models
from sqlalchemy import text

def migrate():
    # Aqui você pode adicionar SQL personalizado para migração
    with engine.connect() as conn:
        # Exemplo de migração
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS migrations (
                id SERIAL PRIMARY KEY,
                version VARCHAR(50) NOT NULL,
                applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))
        conn.commit()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
