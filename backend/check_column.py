from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:postgres@localhost/funntouradmin')
with engine.connect() as connection:
    result = connection.execute(text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'boats' 
        AND column_name = 'marina_id'
    """))
    print(result.fetchall())
