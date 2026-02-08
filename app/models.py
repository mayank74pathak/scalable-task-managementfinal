from sqlalchemy import Column, Integer, String, Boolean, Text
from app.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text)
    completed = Column(Boolean, default=False)
