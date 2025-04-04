from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal
from . import models

from .routers import auth, users, boats, locations

# Importar bookings diretamente
from .routers.bookings import router as bookings

app = FastAPI(
    title="Funn Tour API",
    description="""
    API para gerenciamento de passeios de barco

    ## Perfis de Usuário
    * **Admin**: Acesso total ao sistema
    * **Parceiro**: Gerencia embarcações, roteiros e preços
    * **Cliente**: Visualiza reservas
    """,
    version="1.0.0"
)

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix="/api", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(boats.router, prefix="/api/boats", tags=["boats"])
app.include_router(locations.router, prefix="/api/locations", tags=["locations"])
app.include_router(bookings, prefix="/api/bookings", tags=["bookings"]) # Added bookings router


# Criar tabelas
models.Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Funn Tour"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)