from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.marina import Marina
from app.schemas.marina import MarinaCreate, MarinaUpdate, Marina
from app.core.security import get_current_user
from app.db.models.user import User
from pathlib import Path
import uuid

router = APIRouter()

@router.get("/")
async def read_marinas(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    marinas = db.query(Marina).offset(skip).limit(limit).all()
    return marinas

@router.post("/")
async def create_marina(
    file: UploadFile = File(...),
    marina_data: MarinaCreate = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Processar upload da imagem
    filename = f"{uuid.uuid4()}{Path(file.filename).suffix}"
    file_path = Path(get_settings().UPLOADS_DIR) / filename
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
    
    # Criar marina
    db_marina = Marina(
        **marina_data.dict(),
        main_image_url=f"/uploads/{filename}"
    )
    db.add(db_marina)
    db.commit()
    db.refresh(db_marina)
    return db_marina

@router.get("/{marina_id}")
async def read_marina(
    marina_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    marina = db.query(Marina).filter(Marina.id == marina_id).first()
    if marina is None:
        raise HTTPException(status_code=404, detail="Marina não encontrada")
    return marina

@router.put("/{marina_id}")
async def update_marina(
    marina_id: int,
    marina_data: MarinaUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    marina = db.query(Marina).filter(Marina.id == marina_id).first()
    if marina is None:
        raise HTTPException(status_code=404, detail="Marina não encontrada")
    
    for key, value in marina_data.dict(exclude_unset=True).items():
        setattr(marina, key, value)
    
    db.commit()
    db.refresh(marina)
    return marina

@router.delete("/{marina_id}")
async def delete_marina(
    marina_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    marina = db.query(Marina).filter(Marina.id == marina_id).first()
    if marina is None:
        raise HTTPException(status_code=404, detail="Marina não encontrada")
    
    db.delete(marina)
    db.commit()
    return {"message": "Marina excluída com sucesso"}
