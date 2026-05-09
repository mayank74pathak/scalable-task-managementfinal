from sqlalchemy.orm import Session
from app.models import Task
from app.utils.redis_client import redis_client
from uuid import UUID
import json

CACHE_TTL = 60  # seconds


class TaskService:

    # -------------------------
    # GET ALL TASKS (USER-SPECIFIC + CACHE)
    # -------------------------
    @staticmethod
    def get_tasks(db: Session, page: int, limit: int, status: str, user_id):

        cache_key = f"tasks:{user_id}:{page}:{limit}:{status or 'all'}"

        cached = None

        if redis_client:
            cached = redis_client.get(cache_key)

        if cached:
            data = json.loads(cached)
            return data["total"], data["tasks"]

        query = db.query(Task).filter(Task.user_id == user_id)

        if status:
            query = query.filter(Task.status == status)

        total = query.count()
        tasks = query.offset((page - 1) * limit).limit(limit).all()

        # cache response
        if redis_client:
            redis_client.setex(
                cache_key,
                CACHE_TTL,
                json.dumps({
                    "total": total,
                    "tasks": [
                        {
                            "id": str(t.id),
                            "title": t.title,
                            "description": t.description,
                            "status": t.status,
                            "created_at": t.created_at.isoformat()
                        } for t in tasks
                    ]
                })
            )

        return total, tasks


    # -------------------------
    # GET SINGLE TASK (SECURE + CACHE)
    # -------------------------
    @staticmethod
    def get_task(db: Session, task_id: UUID, user_id):

        cache_key = f"tasks:{user_id}:single:{task_id}"

        cached = None

        if redis_client:
            cached = redis_client.get(cache_key)

        if cached:
            return json.loads(cached)

        task = db.query(Task).filter(
            Task.id == task_id,
            Task.user_id == user_id
        ).first()

        if task and redis_client:
            redis_client.setex(
                cache_key,
                CACHE_TTL,
                json.dumps({
                    "id": str(task.id),
                    "title": task.title,
                    "description": task.description,
                    "status": task.status,
                    "created_at": task.created_at.isoformat()
                })
            )

        return task


    # -------------------------
    # CREATE TASK
    # -------------------------
    @staticmethod
    def create_task(db: Session, title: str, description: str, user_id):

        new_task = Task(
            title=title,
            description=description,
            user_id=user_id
        )

        db.add(new_task)
        db.commit()
        db.refresh(new_task)

        TaskService._invalidate_list_cache(user_id)

        return new_task


    # -------------------------
    # UPDATE TASK
    # -------------------------
    @staticmethod
    def update_task(db: Session, task, data: dict):

        for key, value in data.items():
            setattr(task, key, value)

        db.commit()
        db.refresh(task)

        if redis_client:
            redis_client.delete(f"tasks:{task.user_id}:single:{task.id}")

        TaskService._invalidate_list_cache(task.user_id)

        return task


    # -------------------------
    # DELETE TASK
    # -------------------------
    @staticmethod
    def delete_task(db: Session, task):

        user_id = task.user_id
        task_id = task.id

        db.delete(task)
        db.commit()

        if redis_client:
            redis_client.delete(f"tasks:{user_id}:single:{task_id}")

        TaskService._invalidate_list_cache(user_id)


    # -------------------------
    # CACHE INVALIDATION
    # -------------------------
    @staticmethod
    def _invalidate_list_cache(user_id):

        if not redis_client:
            return

        for key in redis_client.scan_iter(f"tasks:{user_id}:*"):
            redis_client.delete(key)
