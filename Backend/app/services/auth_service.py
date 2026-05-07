from sqlalchemy.orm import Session
from app.models import User
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from app.utils.logger import logger
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set in environment variables")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class AuthService:

    @staticmethod
    def hash_password(password: str):
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain, hashed):
        return pwd_context.verify(plain, hashed)

    @staticmethod
    def create_access_token(data: dict):
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=30)
        to_encode.update({"exp": expire})
        return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def signup(db: Session, email: str, password: str):
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise Exception("Email already registered")

        new_user = User(
            email=email,
            hashed_password=AuthService.hash_password(password)
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
        return new_user

    @staticmethod
    def login(db: Session, email: str, password: str):
        logger.info(f"Login attempt for {email}")

        db_user = db.query(User).filter(User.email == email).first()

        if not db_user or not AuthService.verify_password(password, db_user.hashed_password):
            raise Exception("Invalid credentials")

        logger.info(f"Login successful for {email}")

        return AuthService.create_access_token({"sub": db_user.email})