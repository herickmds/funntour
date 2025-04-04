from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import List

from app.database import engine, get_db
from app import models, schemas
from app.auth import get_password_hash, verify_password, create_access_token, get_current_active_user, get_admin_user, get_partner_user
from app.routers import users, auth, locations

# Criar as tabelas no banco de dados
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Funn Tour API", description="API para gestão de passeios de barco")

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permitir todos os origens em ambiente de desenvolvimento
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(locations.router)

@app.get("/")
def read_root():
    return {"message": "Bem-vindo à API do Funn Tour"}

# Obter usuário atual
@app.get("/api/users/me", response_model=schemas.User)
async def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

# A partir daqui serão desenvolvidos os endpoints adicionais para cada módulo (barcos, passeios, etc.)
# Estes serão implementados à medida que o projeto avança

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)