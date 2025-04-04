from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal
from . import models

from .routers.auth import router as auth_router
from .routers.users import router as users_router
from .routers.boats import router as boats_router
from .routers.bookings import router as bookings_router
from .routers.locations import router as locations_router


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
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(users_router, prefix="/api/users", tags=["users"])
app.include_router(boats_router, prefix="/api/boats", tags=["boats"])
app.include_router(locations_router, prefix="/api/locations", tags=["locations"])
app.include_router(bookings_router, prefix="/api/bookings", tags=["bookings"])


# Criar tabelas
models.Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Funn Tour"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)