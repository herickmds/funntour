from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional
from datetime import datetime, date
import re
from app.core.config import get_settings

settings = get_settings()

class UserBase(BaseModel):
    username: str = Field(..., description="CPF/CNPJ")
    email: EmailStr
    full_name: str
    role: str = Field(..., description="User role: cliente, parceiro, admin")
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    birth_date: Optional[date] = None
    photo_url: str

    @validator('username')
    def validate_cpf_cnpj(cls, v):
        # Basic validation for CPF/CNPJ format
        if not re.match(r'^\d{11}$|^\d{14}$', v):
            raise ValueError('CPF/CNPJ inválido')
        return v

    @validator('role')
    def validate_role(cls, v):
        if v not in ['cliente', 'parceiro', 'admin']:
            raise ValueError('Tipo de usuário inválido')
        return v

class UserCreate(UserBase):
    password: str
    cep: str
    address: str

    @validator('password')
    def validate_password(cls, v):
        if not v:
            return v
        
        if len(v) < 8:
            raise ValueError('A senha deve ter no mínimo 8 caracteres')
        
        if not any(c.isupper() for c in v):
            raise ValueError('A senha deve conter pelo menos 1 caractere maiúsculo')
        
        if not any(c.islower() for c in v):
            raise ValueError('A senha deve conter pelo menos 1 caractere minúsculo')
        
        if not any(c.isdigit() for c in v):
            raise ValueError('A senha deve conter pelo menos 1 número')
        
        if not re.search('[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('A senha deve conter pelo menos 1 caractere especial')
        
        return v

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    whatsapp: Optional[str] = None
    birth_date: Optional[date] = None
    photo_url: Optional[str] = None
    cep: Optional[str] = None
    address: Optional[str] = None
    password: Optional[str] = None

    @validator('password')
    def validate_password(cls, v):
        if not v:
            return v
        
        if len(v) < 8:
            raise ValueError('A senha deve ter no mínimo 8 caracteres')
        
        if not any(c.isupper() for c in v):
            raise ValueError('A senha deve conter pelo menos 1 caractere maiúsculo')
        
        if not any(c.islower() for c in v):
            raise ValueError('A senha deve conter pelo menos 1 caractere minúsculo')
        
        if not any(c.isdigit() for c in v):
            raise ValueError('A senha deve conter pelo menos 1 número')
        
        if not re.search('[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('A senha deve conter pelo menos 1 caractere especial')
        
        return v

class User(UserBase):
    id: int
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
