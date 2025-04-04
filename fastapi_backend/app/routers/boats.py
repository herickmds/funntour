
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.boat import Boat, BoatType, BoatImage, Route, Marina
from ..schemas.boat import BoatCreate, BoatUpdate, BoatResponse

router = APIRouter()

@router.get("/boats", response_model=list[BoatResponse])
def get_boats(db: Session = Depends(get_db)):
    return db.query(Boat).all()

@router.get("/boats/{boat_id}", response_model=BoatResponse)
def get_boat(boat_id: int, db: Session = Depends(get_db)):
    boat = db.query(Boat).filter(Boat.id == boat_id).first()
    if not boat:
        raise HTTPException(status_code=404, detail="Boat not found")
    return boat

@router.post("/boats", response_model=BoatResponse)
def create_boat(boat: BoatCreate, db: Session = Depends(get_db)):
    db_boat = Boat(**boat.dict())
    db.add(db_boat)
    db.commit()
    db.refresh(db_boat)
    return db_boat

@router.put("/boats/{boat_id}", response_model=BoatResponse)
def update_boat(boat_id: int, boat: BoatUpdate, db: Session = Depends(get_db)):
    db_boat = db.query(Boat).filter(Boat.id == boat_id).first()
    if not db_boat:
        raise HTTPException(status_code=404, detail="Boat not found")
    
    for key, value in boat.dict(exclude_unset=True).items():
        setattr(db_boat, key, value)
    
    db.commit()
    db.refresh(db_boat)
    return db_boat

@router.delete("/boats/{boat_id}")
def delete_boat(boat_id: int, db: Session = Depends(get_db)):
    db_boat = db.query(Boat).filter(Boat.id == boat_id).first()
    if not db_boat:
        raise HTTPException(status_code=404, detail="Boat not found")
    
    db.delete(db_boat)
    db.commit()
    return {"message": "Boat deleted"}
