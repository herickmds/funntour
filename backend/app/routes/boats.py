from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.boat import Boat
from app.schemas.boat import BoatCreate, BoatUpdate, Boat
from app.core.security import get_current_user
from app.db.models.user import User
from pathlib import Path
import uuid

router = APIRouter()

@router.get("/")
async def read_boats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    boats = db.query(Boat).offset(skip).limit(limit).all()
    return boats

@router.post("/")
async def create_boat(
    file: UploadFile = File(...),
    boat_data: BoatCreate = Depends(),
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
    
    # Criar embarcação
    db_boat = Boat(
        **boat_data.dict(exclude={"owner_id"}),
        main_image_url=f"/uploads/{filename}",
        owner_id=current_user.id
    )
    db.add(db_boat)
    db.commit()
    db.refresh(db_boat)
    return db_boat

@router.get("/{boat_id}")
async def read_boat(
    boat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.id != boat_data.owner_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    boat = db.query(Boat).filter(Boat.id == boat_id).first()
    if boat is None:
        raise HTTPException(status_code=404, detail="Embarcação não encontrada")
    return boat

@router.put("/{boat_id}")
async def update_boat(
    boat_id: int,
    boat_data: BoatUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.id != boat_data.owner_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    boat = db.query(Boat).filter(Boat.id == boat_id).first()
    if boat is None:
        raise HTTPException(status_code=404, detail="Embarcação não encontrada")
    
    for key, value in boat_data.dict(exclude_unset=True).items():
        setattr(boat, key, value)
    
    db.commit()
    db.refresh(boat)
    return boat

@router.delete("/{boat_id}")
async def delete_boat(
    boat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.id != boat_data.owner_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    boat = db.query(Boat).filter(Boat.id == boat_id).first()
    if boat is None:
        raise HTTPException(status_code=404, detail="Embarcação não encontrada")
    
    db.delete(boat)
    db.commit()
    return {"message": "Embarcação excluída com sucesso"}
