"""
Pydantic Schemas for Authentication and User Management
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: Optional[str] = "STUDENT"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    email: str
    full_name: str
    role: str
    profile_is_complete: Optional[bool] = False
    profile_completion_percentage: Optional[int] = 0

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime
    profile_is_complete: Optional[bool] = False
    profile_completion_percentage: Optional[int] = 0

    class Config:
        from_attributes = True

class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str
