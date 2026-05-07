from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime
from typing import List
from enum import Enum


# ✅ Enum with normalization helper
class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    done = "done"

    @classmethod
    def normalize(cls, value: str | None) -> str:
        if not value:
            return "pending"

        value = value.strip().lower().replace(" ", "_")

        if value not in cls._value2member_map_:
            return "pending"

        return value


# -------------------------
# CREATE
# -------------------------
class TaskCreate(BaseModel):
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.pending   # 🔥 Added default status

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Title must not be blank")
        if len(v) > 200:
            raise ValueError("Title must be 200 characters or fewer")
        return v.strip()

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        return TaskStatus.normalize(v)


# -------------------------
# UPDATE
# -------------------------
class TaskUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, v: str | None) -> str | None:
        if v is not None:
            if not v.strip():
                raise ValueError("Title must not be blank")
            if len(v) > 200:
                raise ValueError("Title must be 200 characters or fewer")
            return v.strip()
        return v

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None:
            return v
        return TaskStatus.normalize(v)


# -------------------------
# RESPONSE
# -------------------------
class TaskResponse(BaseModel):
    id: UUID
    title: str
    description: str | None
    status: TaskStatus
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


# -------------------------
# LIST RESPONSE
# -------------------------
class TaskListResponse(BaseModel):
    total: int
    page: int
    limit: int
    data: List[TaskResponse]