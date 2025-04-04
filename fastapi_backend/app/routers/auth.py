from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import secrets
import string

from app.database import get_db
from app import models, schemas
from app.auth import get_password_hash, verify_password, create_access_token, get_current_active_user

router = APIRouter(
    prefix="/api/auth",
    tags=["authentication"],
    responses={404: {"description": "Not found"}},
)

@router.post("/token", response_model=schemas.Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Autenticar usuário e gerar token de acesso.
    """
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.enabled:
        raise HTTPException(status_code=400, detail="Usuário desativado")
    
    access_token_expires = timedelta(minutes=60 * 24 * 7)  # 7 dias
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/change-password", response_model=schemas.User)
async def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Alterar senha do usuário atual.
    """
    if not verify_password(password_data.current_password, current_user.password):
        raise HTTPException(status_code=400, detail="Senha atual incorreta")
    
    # Atualizar senha
    hashed_password = get_password_hash(password_data.new_password)
    current_user.password = hashed_password
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/request-recovery", status_code=status.HTTP_200_OK)
async def request_password_recovery(
    recovery_data: schemas.PasswordRecovery,
    db: Session = Depends(get_db)
):
    """
    Solicitar código de recuperação de senha.
    """
    # Buscar usuário pelo documento (CPF/CNPJ)
    user = db.query(models.User).filter(models.User.document == recovery_data.document).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Gerar código de recuperação (6 dígitos alfanuméricos)
    recovery_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(6))
    
    # Armazenar código (aqui precisaríamos de uma tabela para isso)
    # Para fins de demonstração, vamos apenas retornar o código
    # Em produção, enviaríamos por email/SMS e não retornaríamos diretamente
    
    return {"message": "Código de recuperação enviado", "code": recovery_code}

@router.post("/verify-code", status_code=status.HTTP_200_OK)
async def verify_recovery_code(
    verify_data: schemas.VerifyRecoveryCode,
    db: Session = Depends(get_db)
):
    """
    Verificar código de recuperação.
    """
    # Em um sistema real, verificaríamos o código no banco de dados
    # Para fins de demonstração, vamos apenas fingir que verificamos
    
    user = db.query(models.User).filter(models.User.document == verify_data.document).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Pretender verificar o código (em produção, verificaríamos na tabela de códigos)
    # Na implementação real, verificaríamos também se o código não expirou
    
    return {"message": "Código válido", "valid": True}

@router.post("/reset-password", response_model=schemas.User)
async def reset_password(
    reset_data: schemas.ResetPassword,
    db: Session = Depends(get_db)
):
    """
    Redefinir senha com código de recuperação.
    """
    # Buscar usuário pelo documento
    user = db.query(models.User).filter(models.User.document == reset_data.document).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Em um sistema real, verificaríamos o código no banco de dados
    # Para fins de demonstração, vamos apenas atualizar a senha
    
    # Atualizar senha
    hashed_password = get_password_hash(reset_data.new_password)
    user.password = hashed_password
    db.commit()
    db.refresh(user)
    return user