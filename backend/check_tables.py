import sqlalchemy
from app.db.session import engine

print('Conectando ao banco...')
with engine.connect() as conn:
    print('Conectado com sucesso!')
    print('Verificando tabelas...')
    result = conn.execute(sqlalchemy.text("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"))
    tables = result.fetchall()
    print('Tabelas encontradas:', tables)
