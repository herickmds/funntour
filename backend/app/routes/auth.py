from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from app.core.security import get_password_hash, create_access_token, verify_password, generate_recovery_code, validate_recovery_code
from app.schemas.user import UserCreate, UserUpdate
from app.core.config import settings
from app.services.free_notification_service import free_notification_service
from jose import jwt
from jose.exceptions import JWTError
import random
import string
from datetime import datetime, timedelta

router = APIRouter()

async def get_current_token(token: str = Depends(OAuth2PasswordBearer(tokenUrl="token"))):
    return token

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(get_current_token)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="CPF/CNPJ ou senha inválidos!",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(
        data={"sub": user.username}
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register")
async def register(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):
    # Verificar se o usuário já existe
    if db.query(User).filter(User.username == user_data.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="CPF/CNPJ já cadastrado(s) em nosso sistema!"
        )
    
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado em nosso sistema!"
        )
    
    # Validar tipo de usuário
    if user_data.role not in ['cliente', 'parceiro', 'admin']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipo de usuário inválido"
        )
    
    # Criar usuário
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        **user_data.dict(exclude={"password"}),
        hashed_password=hashed_password,
        is_active=True,
        is_admin=user_data.role == 'admin'
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message": "Cadastro realizado com sucesso!", "user": db_user}

@router.post("/recover-password")
async def recover_password(
    username: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Gerar código de recuperação
    recovery_code = generate_recovery_code()
    user.recovery_code = recovery_code
    user.recovery_code_expires = datetime.utcnow() + timedelta(minutes=30)
    db.commit()
    
    # Enviar código por email e/ou WhatsApp
    try:
        # Enviar por email
        await free_notification_service.send_email(user.email, recovery_code)
        
        # Enviar por WhatsApp se disponível
        if user.whatsapp:
            await free_notification_service.send_whatsapp(user.whatsapp, recovery_code)
            
        return {"message": "Código de recuperação enviado com sucesso!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao enviar código de recuperação: {str(e)}"
        )

@router.post("/reset-password")
async def reset_password(
    username: str,
    recovery_code: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    # Validar código de recuperação
    if not user.recovery_code or not user.recovery_code_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado!"
        )
    
    if user.recovery_code != recovery_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado!"
        )
    
    if datetime.utcnow() > user.recovery_code_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Código inválido ou expirado!"
        )
    
    # Atualizar senha
    hashed_password = get_password_hash(new_password)
    user.hashed_password = hashed_password
    user.recovery_code = None
    user.recovery_code_expires = None
    db.commit()
    
    return {"message": "Senha alterada com sucesso!"}

@router.get("/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me")
async def update_user(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Atualizar campos do usuário
    for field, value in user_data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    
    # Se a senha foi atualizada, hash ela
    if user_data.password:
        current_user.hashed_password = get_password_hash(user_data.password)
    
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Cadastro atualizado com sucesso!", "user": current_user}
