from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.task_service import TaskService
from app.schemas.task_schema import TaskCreate, TaskUpdate, TaskResponse, TaskListResponse
from app.models import Task
from uuid import UUID
from app.dependencies.auth_dependencies import get_current_user
from app.utils.logger import logger

router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
    dependencies=[Depends(get_current_user)]   # 🔐 Auth required
)


def log_task(title: str):
    print(f"Task Created: {title}")


# -------------------------
# GET ALL TASKS (USER-SPECIFIC)
# -------------------------
@router.get("/", response_model=TaskListResponse)
async def get_tasks(
    page: int = Query(1, ge=1),
    limit: int = Query(10, le=100),
    status: str = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)   # 🔥 ADD
):
    total, tasks = TaskService.get_tasks(
        db,
        page,
        limit,
        status,
        current_user.id   # 🔥 FILTER BY USER
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "data": tasks
    }


# -------------------------
# CREATE TASK (ATTACH USER)
# -------------------------
@router.post("/", response_model=TaskResponse)
async def create_task(
    task: TaskCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)   # 🔥 ADD
):
    logger.info(f"Creating task: {task.title}")

    new_task = TaskService.create_task(
        db,
        task.title,
        task.description,
        current_user.id   # 🔥 ASSIGN OWNER
    )

    logger.info(f"Task created successfully: {new_task.id}")
    background_tasks.add_task(log_task, new_task.title)

    return new_task


# -------------------------
# GET SINGLE TASK (SECURE)
# -------------------------
@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)   # 🔥 ADD
):
    task = TaskService.get_task(
        db,
        task_id,
        current_user.id   # 🔥 CHECK OWNER
    )

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return task


# -------------------------
# UPDATE TASK (SECURE)
# -------------------------
@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: UUID,
    data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)   # 🔥 ADD
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id   # 🔥 OWNER CHECK
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    return TaskService.update_task(
        db,
        task,
        data.dict(exclude_unset=True)
    )


# -------------------------
# DELETE TASK (SECURE)
# -------------------------
@router.delete("/{task_id}")
async def delete_task(
    task_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)   # 🔥 ADD
):
    task = db.query(Task).filter(
        Task.id == task_id,
        Task.user_id == current_user.id   # 🔥 OWNER CHECK
    ).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    TaskService.delete_task(db, task)

    return {"message": "Task deleted"}