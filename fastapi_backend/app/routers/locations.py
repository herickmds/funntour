from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_active_user, get_admin_user

router = APIRouter(
    prefix="/api/locations",
    tags=["locations"],
    responses={404: {"description": "Not found"}},
)

# ==================== Country Routes ====================

@router.get("/countries", response_model=List[schemas.Country])
async def read_countries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """
    Obter lista de países.
    """
    countries = db.query(models.Country).offset(skip).limit(limit).all()
    return countries

@router.get("/countries/{country_id}", response_model=schemas.Country)
async def read_country(
    country_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de um país específico por ID.
    """
    country = db.query(models.Country).filter(models.Country.id == country_id).first()
    if country is None:
        raise HTTPException(status_code=404, detail="País não encontrado")
    return country

@router.post("/countries", response_model=schemas.Country)
async def create_country(
    country: schemas.CountryCreate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Criar um novo país. Apenas admin tem acesso.
    """
    # Verificar se já existe país com mesmo nome
    db_country = db.query(models.Country).filter(models.Country.name == country.name).first()
    if db_country:
        raise HTTPException(status_code=400, detail="País com este nome já existe")
    
    # Verificar se já existe país com mesmo código
    db_country = db.query(models.Country).filter(models.Country.code == country.code).first()
    if db_country:
        raise HTTPException(status_code=400, detail="País com este código já existe")
    
    # Criar país
    db_country = models.Country(**country.dict())
    db.add(db_country)
    db.commit()
    db.refresh(db_country)
    return db_country

@router.patch("/countries/{country_id}", response_model=schemas.Country)
async def update_country(
    country_id: int,
    country_update: schemas.CountryUpdate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar um país existente. Apenas admin tem acesso.
    """
    db_country = db.query(models.Country).filter(models.Country.id == country_id).first()
    if db_country is None:
        raise HTTPException(status_code=404, detail="País não encontrado")
    
    # Verificar se já existe país com mesmo nome (se estiver sendo atualizado)
    if country_update.name is not None:
        existing_country = db.query(models.Country).filter(
            models.Country.name == country_update.name,
            models.Country.id != country_id
        ).first()
        if existing_country:
            raise HTTPException(status_code=400, detail="País com este nome já existe")
        db_country.name = country_update.name
    
    # Verificar se já existe país com mesmo código (se estiver sendo atualizado)
    if country_update.code is not None:
        existing_country = db.query(models.Country).filter(
            models.Country.code == country_update.code,
            models.Country.id != country_id
        ).first()
        if existing_country:
            raise HTTPException(status_code=400, detail="País com este código já existe")
        db_country.code = country_update.code
    
    db.commit()
    db.refresh(db_country)
    return db_country

@router.delete("/countries/{country_id}", response_model=schemas.Country)
async def delete_country(
    country_id: int,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Excluir um país. Apenas admin tem acesso.
    """
    db_country = db.query(models.Country).filter(models.Country.id == country_id).first()
    if db_country is None:
        raise HTTPException(status_code=404, detail="País não encontrado")
    
    # Verificar se há estados associados
    has_states = db.query(models.State).filter(models.State.countryId == country_id).first()
    if has_states:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir o país pois há estados associados a ele"
        )
    
    db.delete(db_country)
    db.commit()
    return db_country

# ==================== State Routes ====================

@router.get("/states", response_model=List[schemas.State])
async def read_states(
    skip: int = 0,
    limit: int = 100,
    country_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Obter lista de estados. Pode ser filtrado por país.
    """
    query = db.query(models.State)
    if country_id:
        query = query.filter(models.State.countryId == country_id)
    
    states = query.offset(skip).limit(limit).all()
    return states

@router.get("/states/{state_id}", response_model=schemas.StateWithCountry)
async def read_state(
    state_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de um estado específico por ID.
    """
    state = db.query(models.State).filter(models.State.id == state_id).first()
    if state is None:
        raise HTTPException(status_code=404, detail="Estado não encontrado")
    return state

@router.post("/states", response_model=schemas.State)
async def create_state(
    state: schemas.StateCreate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Criar um novo estado. Apenas admin tem acesso.
    """
    # Verificar se o país existe
    country = db.query(models.Country).filter(models.Country.id == state.countryId).first()
    if not country:
        raise HTTPException(status_code=404, detail="País não encontrado")
    
    # Verificar se já existe estado com mesmo nome e país
    db_state = db.query(models.State).filter(
        models.State.name == state.name,
        models.State.countryId == state.countryId
    ).first()
    if db_state:
        raise HTTPException(status_code=400, detail="Estado com este nome já existe neste país")
    
    # Verificar se já existe estado com mesmo código e país
    db_state = db.query(models.State).filter(
        models.State.code == state.code,
        models.State.countryId == state.countryId
    ).first()
    if db_state:
        raise HTTPException(status_code=400, detail="Estado com este código já existe neste país")
    
    # Criar estado
    db_state = models.State(**state.dict())
    db.add(db_state)
    db.commit()
    db.refresh(db_state)
    return db_state

@router.patch("/states/{state_id}", response_model=schemas.State)
async def update_state(
    state_id: int,
    state_update: schemas.StateUpdate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar um estado existente. Apenas admin tem acesso.
    """
    db_state = db.query(models.State).filter(models.State.id == state_id).first()
    if db_state is None:
        raise HTTPException(status_code=404, detail="Estado não encontrado")
    
    # Se estiver atualizando o país, verificar se ele existe
    if state_update.countryId is not None:
        country = db.query(models.Country).filter(models.Country.id == state_update.countryId).first()
        if not country:
            raise HTTPException(status_code=404, detail="País não encontrado")
        db_state.countryId = state_update.countryId
    
    # Verificar se já existe estado com mesmo nome e país (se estiver sendo atualizado)
    if state_update.name is not None:
        country_id = state_update.countryId if state_update.countryId is not None else db_state.countryId
        existing_state = db.query(models.State).filter(
            models.State.name == state_update.name,
            models.State.countryId == country_id,
            models.State.id != state_id
        ).first()
        if existing_state:
            raise HTTPException(status_code=400, detail="Estado com este nome já existe neste país")
        db_state.name = state_update.name
    
    # Verificar se já existe estado com mesmo código e país (se estiver sendo atualizado)
    if state_update.code is not None:
        country_id = state_update.countryId if state_update.countryId is not None else db_state.countryId
        existing_state = db.query(models.State).filter(
            models.State.code == state_update.code,
            models.State.countryId == country_id,
            models.State.id != state_id
        ).first()
        if existing_state:
            raise HTTPException(status_code=400, detail="Estado com este código já existe neste país")
        db_state.code = state_update.code
    
    db.commit()
    db.refresh(db_state)
    return db_state

@router.delete("/states/{state_id}", response_model=schemas.State)
async def delete_state(
    state_id: int,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Excluir um estado. Apenas admin tem acesso.
    """
    db_state = db.query(models.State).filter(models.State.id == state_id).first()
    if db_state is None:
        raise HTTPException(status_code=404, detail="Estado não encontrado")
    
    # Verificar se há cidades associadas
    has_cities = db.query(models.City).filter(models.City.stateId == state_id).first()
    if has_cities:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir o estado pois há cidades associadas a ele"
        )
    
    db.delete(db_state)
    db.commit()
    return db_state

# ==================== City Routes ====================

@router.get("/cities", response_model=List[schemas.City])
async def read_cities(
    skip: int = 0,
    limit: int = 100,
    state_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """
    Obter lista de cidades. Pode ser filtrado por estado.
    """
    query = db.query(models.City)
    if state_id:
        query = query.filter(models.City.stateId == state_id)
    
    cities = query.offset(skip).limit(limit).all()
    return cities

@router.get("/cities/{city_id}", response_model=schemas.CityWithState)
async def read_city(
    city_id: int,
    db: Session = Depends(get_db)
):
    """
    Obter detalhes de uma cidade específica por ID.
    """
    city = db.query(models.City).filter(models.City.id == city_id).first()
    if city is None:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
    return city

@router.post("/cities", response_model=schemas.City)
async def create_city(
    city: schemas.CityCreate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Criar uma nova cidade. Apenas admin tem acesso.
    """
    # Verificar se o estado existe
    state = db.query(models.State).filter(models.State.id == city.stateId).first()
    if not state:
        raise HTTPException(status_code=404, detail="Estado não encontrado")
    
    # Verificar se já existe cidade com mesmo nome e estado
    db_city = db.query(models.City).filter(
        models.City.name == city.name,
        models.City.stateId == city.stateId
    ).first()
    if db_city:
        raise HTTPException(status_code=400, detail="Cidade com este nome já existe neste estado")
    
    # Criar cidade
    db_city = models.City(**city.dict())
    db.add(db_city)
    db.commit()
    db.refresh(db_city)
    return db_city

@router.patch("/cities/{city_id}", response_model=schemas.City)
async def update_city(
    city_id: int,
    city_update: schemas.CityUpdate,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Atualizar uma cidade existente. Apenas admin tem acesso.
    """
    db_city = db.query(models.City).filter(models.City.id == city_id).first()
    if db_city is None:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
    
    # Se estiver atualizando o estado, verificar se ele existe
    if city_update.stateId is not None:
        state = db.query(models.State).filter(models.State.id == city_update.stateId).first()
        if not state:
            raise HTTPException(status_code=404, detail="Estado não encontrado")
        db_city.stateId = city_update.stateId
    
    # Verificar se já existe cidade com mesmo nome e estado (se estiver sendo atualizado)
    if city_update.name is not None:
        state_id = city_update.stateId if city_update.stateId is not None else db_city.stateId
        existing_city = db.query(models.City).filter(
            models.City.name == city_update.name,
            models.City.stateId == state_id,
            models.City.id != city_id
        ).first()
        if existing_city:
            raise HTTPException(status_code=400, detail="Cidade com este nome já existe neste estado")
        db_city.name = city_update.name
    
    db.commit()
    db.refresh(db_city)
    return db_city

@router.delete("/cities/{city_id}", response_model=schemas.City)
async def delete_city(
    city_id: int,
    current_user: models.User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    Excluir uma cidade. Apenas admin tem acesso.
    """
    db_city = db.query(models.City).filter(models.City.id == city_id).first()
    if db_city is None:
        raise HTTPException(status_code=404, detail="Cidade não encontrada")
    
    # Verificar se há marinas associadas
    has_marinas = db.query(models.Marina).filter(models.Marina.cityId == city_id).first()
    if has_marinas:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir a cidade pois há marinas associadas a ela"
        )
    
    db.delete(db_city)
    db.commit()
    return db_city