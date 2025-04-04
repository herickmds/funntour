from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Esquemas para Country
class CountryBase(BaseModel):
    name: str
    code: str

class CountryCreate(CountryBase):
    pass

class CountryUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None

class Country(CountryBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

# Esquemas para State
class StateBase(BaseModel):
    name: str
    code: str
    countryId: int

class StateCreate(StateBase):
    pass

class StateUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    countryId: Optional[int] = None

class State(StateBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class StateWithCountry(State):
    country: Country

# Esquemas para City
class CityBase(BaseModel):
    name: str
    stateId: int

class CityCreate(CityBase):
    pass

class CityUpdate(BaseModel):
    name: Optional[str] = None
    stateId: Optional[int] = None

class City(CityBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

class CityWithState(City):
    state: State