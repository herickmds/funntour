from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.user import User
from app.schemas.user import UserCreate, UserUpdate, User
from app.core.security import get_current_user
from app.core.config import get_settings
from pathlib import Path
import uuid

settings = get_settings()
router = APIRouter()

@router.get("/")
async def read_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    users = db.query(User).offset(skip).limit(limit).all()
    return users

@router.post("/")
async def create_user(
    file: UploadFile = File(...),
    user_data: UserCreate = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Processar upload da imagem
    filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    file_path = Path(settings.UPLOADS_DIR) / filename
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Criar usuário
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        **user_data.dict(exclude={"password"}),
        hashed_password=hashed_password,
        photo_url=f"/uploads/{filename}"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.get("/{user_id}")
async def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return user

@router.put("/{user_id}")
async def update_user(
    user_id: int,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    for key, value in user_data.dict(exclude_unset=True).items():
        if key == "password":
            setattr(user, "hashed_password", get_password_hash(value))
        else:
            setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    db.delete(user)
    db.commit()
    return {"message": "Usuário excluído com sucesso"}
