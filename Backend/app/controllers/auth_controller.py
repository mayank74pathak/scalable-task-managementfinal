from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.auth_service import AuthService
from app.schemas.auth_schema import UserSignup, UserLogin, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup")
async def signup(user: UserSignup, db: Session = Depends(get_db)):
    try:
        AuthService.signup(db, user.email, user.password)
        return {"message": "User created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    try:
        token = AuthService.login(db, user.email, user.password)
        return {
            "access_token": token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))