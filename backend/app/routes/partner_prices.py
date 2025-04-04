from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models.partner_price import PartnerPrice
from app.schemas.partner_price import PartnerPriceCreate, PartnerPriceUpdate, PartnerPrice
from app.core.security import get_current_user
from app.db.models.user import User
from datetime import datetime

router = APIRouter()

@router.get("/")
async def read_partner_prices(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acesso negado")
    partner_prices = db.query(PartnerPrice).offset(skip).limit(limit).all()
    return partner_prices

@router.post("/")
async def create_partner_price(
    price_data: PartnerPriceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.role != "parceiro":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    # Se for um parceiro, verificar se está criando um preço para si mesmo
    if current_user.role == "parceiro" and price_data.partner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não é permitido criar preços para outros parceiros")
    
    # Verificar se o barco existe
    boat = db.query(Boat).filter(Boat.id == price_data.boat_id).first()
    if not boat:
        raise HTTPException(status_code=404, detail="Embarcação não encontrada")
    
    db_price = PartnerPrice(
        **price_data.dict()
    )
    db.add(db_price)
    db.commit()
    db.refresh(db_price)
    return db_price

@router.put("/{price_id}")
async def update_partner_price(
    price_id: int,
    price_data: PartnerPriceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.role != "parceiro":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    price = db.query(PartnerPrice).filter(PartnerPrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Preço não encontrado")
    
    # Verificar permissões
    if current_user.role == "parceiro" and price.partner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não é permitido editar preços de outros parceiros")
    
    # Se for um parceiro, não pode mudar o partnerId ou o boatId
    if current_user.role == "parceiro":
        if price_data.partner_id and price_data.partner_id != current_user.id:
            raise HTTPException(status_code=403, detail="Não é permitido alterar o proprietário do preço")
        
        if price_data.boat_id and price_data.boat_id != price.boat_id:
            raise HTTPException(status_code=403, detail="Não é permitido alterar a embarcação associada")
    
    for key, value in price_data.dict(exclude_unset=True).items():
        setattr(price, key, value)
    
    db.commit()
    db.refresh(price)
    return price

@router.delete("/{price_id}")
async def delete_partner_price(
    price_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.role != "parceiro":
        raise HTTPException(status_code=403, detail="Acesso negado")
    
    price = db.query(PartnerPrice).filter(PartnerPrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Preço não encontrado")
    
    # Verificar permissões
    if current_user.role == "parceiro" and price.partner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Não é permitido excluir preços de outros parceiros")
    
    db.delete(price)
    db.commit()
    return {"message": "Preço excluído com sucesso"}
