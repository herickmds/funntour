from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.booking import Booking
from app.schemas.booking import BookingCreate, BookingUpdate, Booking
from app.core.security import get_current_user
from app.db.models.user import User
from datetime import datetime

router = APIRouter()

@router.get("/")
async def read_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    if current_user.role != "admin":
        bookings = db.query(Booking).filter(Booking.user_id == current_user.id).offset(skip).limit(limit).all()
    else:
        bookings = db.query(Booking).offset(skip).limit(limit).all()
    return bookings

@router.post("/")
async def create_booking(
    booking_data: BookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verificar disponibilidade do barco
    boat = db.query(Boat).filter(Boat.id == booking_data.boat_id).first()
    if not boat:
        raise HTTPException(status_code=404, detail="Embarcação não encontrada")
    if not boat.is_available:
        raise HTTPException(status_code=400, detail="Embarcação não está disponível")
    
    # Calcular preço total
    days = (booking_data.end_date - booking_data.start_date).days
    total_price = days * boat.price_per_day
    
    # Criar reserva
    db_booking = Booking(
        **booking_data.dict(),
        user_id=current_user.id,
        total_price=total_price,
        status="pending"
    )
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking

@router.put("/{booking_id}/status")
async def update_booking_status(
    booking_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    if status not in ["pending", "confirmed", "cancelled", "completed"]:
        raise HTTPException(status_code=400, detail="Status inválido")
    
    booking.status = status
    db.commit()
    db.refresh(booking)
    return booking

@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Reserva não encontrada")
    
    if current_user.role != "admin" and current_user.id != booking.user_id:
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    if booking.status == "completed":
        raise HTTPException(status_code=400, detail="Não é possível cancelar uma reserva concluída")
    
    booking.status = "cancelled"
    db.commit()
    db.refresh(booking)
    return booking
