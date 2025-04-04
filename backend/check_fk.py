from sqlalchemy import create_engine, text

engine = create_engine('postgresql://postgres:postgres@localhost/funntouradmin')
with engine.connect() as connection:
    result = connection.execute(text("""
        SELECT conname as constraint_name,
               pg_catalog.pg_get_constraintdef(r.oid, true) as constraint_definition
        FROM pg_catalog.pg_constraint r
        WHERE r.conrelid = (
            SELECT oid FROM pg_class WHERE relname = 'boats'
        ) AND r.contype = 'f' AND r.conname = 'fk_boats_marinas'
    """))
    print(result.fetchall())
