
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List

router = APIRouter()

@router.get("/", response_model=List[schemas.Booking])
def get_bookings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    bookings = db.query(models.Booking).offset(skip).limit(limit).all()
    return bookings

@router.get("/{booking_id}", response_model=schemas.Booking)
def get_booking(booking_id: int, db: Session = Depends(get_db)):
    booking = db.query(models.Booking).filter(models.Booking.id == booking_id).first()
    if booking is None:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    return booking
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, get_admin_user

router = APIRouter()

@router.get("/", response_model=List[schemas.Booking])
async def read_bookings(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obter lista de reservas.
    """
    bookings = db.query(models.Booking).offset(skip).limit(limit).all()
    return bookings

@router.post("/", response_model=schemas.Booking)
async def create_booking(
    booking: schemas.BookingCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """
    Criar uma nova reserva.
    """
    db_booking = models.Booking(**booking.dict(), userId=current_user.id)
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking
