
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, SessionLocal
from . import models, schemas
from .routers import auth, users, boats, bookings, content, locations
from typing import List
import uvicorn

app = FastAPI(
    title="Funn Tour API",
    description="""
    API para gerenciamento de passeios de barco
    
    ## Perfis de Usuário
    
    * **Admin**: Acesso total ao sistema
    * **Parceiro**: Gerencia embarcações, roteiros e preços
    * **Cliente**: Visualiza reservas
    
    ## Funcionalidades
    
    * Autenticação e Recuperação de Senha
    * Gestão de Usuários
    * Gestão de Embarcações
    * Gestão de Roteiros
    * Gestão de Reservas
    * Gestão de Conteúdo
    * Gestão de Localizações
    """,
    version="1.0.0",
    openapi_tags=[
        {"name": "auth", "description": "Autenticação e recuperação de senha"},
        {"name": "users", "description": "Operações com usuários"},
        {"name": "boats", "description": "Gestão de embarcações"},
        {"name": "bookings", "description": "Gestão de reservas"},
        {"name": "content", "description": "Gestão de conteúdo"},
        {"name": "locations", "description": "Gestão de localizações"},
    ]
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
app.include_router(bookings.router, prefix="/api/bookings", tags=["bookings"])
app.include_router(content.router, prefix="/api/content", tags=["content"])
app.include_router(locations.router, prefix="/api/locations", tags=["locations"])

# Criar tabelas
models.Base.metadata.create_all(bind=engine)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Funn Tour"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=True)
