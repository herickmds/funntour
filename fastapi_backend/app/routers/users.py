from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_password_hash, get_current_active_user, get_admin_user

router = APIRouter(
    prefix="/api/users",
    tags=["users"],
    responses={404: {"description": "Not found"}},
)

@router.get("/", response_model=List[schemas.User])
async def read_users(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obter lista de usuários. Apenas admin tem acesso.
    """
    users = db.query(models.User).offset(skip).limit(limit).all()
    return users

@router.get("/partners", response_model=List[schemas.User])
async def read_partners(
    skip: int = 0,
    limit: int = 100,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obter lista de parceiros. Apenas admin tem acesso.
    """
    partners = db.query(models.User).filter(models.User.role == "parceiro").offset(skip).limit(limit).all()
    return partners

@router.get("/{user_id}", response_model=schemas.User)
async def read_user(
    user_id: int,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de um usuário específico por ID. Apenas admin tem acesso.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return db_user

@router.post("/", response_model=schemas.User)
async def create_user(
    user: schemas.UserCreate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Criar um novo usuário. Apenas admin tem acesso.
    """
    # Verificar se username já existe
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Nome de usuário já registrado")
    
    # Verificar se email já existe
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email já registrado")
    
    # Verificar se documento já existe
    db_user = db.query(models.User).filter(models.User.document == user.document).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Documento já registrado")
    
    # Criar usuário
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        password=hashed_password,
        fullName=user.fullName,
        document=user.document,
        phone=user.phone,
        role=user.role,
        enabled=user.enabled
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.patch("/{user_id}", response_model=schemas.User)
async def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar um usuário existente. Apenas admin tem acesso.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Verificar se username já existe (se estiver sendo atualizado)
    if user_update.username is not None:
        existing_user = db.query(models.User).filter(
            models.User.username == user_update.username,
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Nome de usuário já registrado")
        db_user.username = user_update.username
    
    # Verificar se email já existe (se estiver sendo atualizado)
    if user_update.email is not None:
        existing_user = db.query(models.User).filter(
            models.User.email == user_update.email,
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email já registrado")
        db_user.email = user_update.email
    
    # Verificar se documento já existe (se estiver sendo atualizado)
    if user_update.document is not None:
        existing_user = db.query(models.User).filter(
            models.User.document == user_update.document,
            models.User.id != user_id
        ).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Documento já registrado")
        db_user.document = user_update.document
    
    # Atualizar outros campos
    if user_update.fullName is not None:
        db_user.fullName = user_update.fullName
    if user_update.phone is not None:
        db_user.phone = user_update.phone
    if user_update.role is not None:
        db_user.role = user_update.role
    if user_update.enabled is not None:
        db_user.enabled = user_update.enabled
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}", response_model=schemas.User)
async def delete_user(
    user_id: int,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Excluir um usuário. Apenas admin tem acesso.
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    # Não permitir excluir o próprio usuário admin
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Não é possível excluir seu próprio usuário")
    
    db.delete(db_user)
    db.commit()
    return db_user