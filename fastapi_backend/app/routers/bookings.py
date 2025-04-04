
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
