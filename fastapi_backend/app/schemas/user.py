from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    CLIENT = "cliente"
    PARTNER = "parceiro"

# Esquemas base
class UserBase(BaseModel):
    username: str
    email: EmailStr
    fullName: str
    document: str
    phone: Optional[str] = None
    role: UserRole = UserRole.CLIENT
    enabled: bool = True

class UserCreate(UserBase):
    password: str

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter pelo menos 8 caracteres')
        if not any(char.isdigit() for char in v):
            raise ValueError('A senha deve conter pelo menos um número')
        if not any(char.isalpha() for char in v):
            raise ValueError('A senha deve conter pelo menos uma letra')
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    fullName: Optional[str] = None
    document: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[UserRole] = None
    enabled: Optional[bool] = None

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter pelo menos 8 caracteres')
        if not any(char.isdigit() for char in v):
            raise ValueError('A senha deve conter pelo menos um número')
        if not any(char.isalpha() for char in v):
            raise ValueError('A senha deve conter pelo menos uma letra')
        return v

class PasswordRecovery(BaseModel):
    document: str

class VerifyRecoveryCode(BaseModel):
    document: str
    code: str

class ResetPassword(BaseModel):
    document: str
    code: str
    new_password: str

    @validator('new_password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('A senha deve ter pelo menos 8 caracteres')
        if not any(char.isdigit() for char in v):
            raise ValueError('A senha deve conter pelo menos um número')
        if not any(char.isalpha() for char in v):
            raise ValueError('A senha deve conter pelo menos uma letra')
        return v

# Esquemas para retorno
class User(UserBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None

    class Config:
        orm_mode = True

# Esquemas para autenticação
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    id: Optional[int] = None
    role: Optional[str] = None