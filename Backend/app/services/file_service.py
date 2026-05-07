
import os
import csv
from io import StringIO
from uuid import uuid4

from app.models import Task
from app.schemas.task_schema import TaskStatus
from app.services.task_service import TaskService

BASE_UPLOAD_DIR = "uploads"
os.makedirs(BASE_UPLOAD_DIR, exist_ok=True)


class FileService:

    # -------------------------
    # SAVE FILE (USER ISOLATED)
    # -------------------------
    @staticmethod
    async def save_file(file, user_id):
        if not file.filename.endswith(".csv"):
            raise Exception("Only CSV files allowed")

        user_folder = os.path.join(BASE_UPLOAD_DIR, str(user_id))
        os.makedirs(user_folder, exist_ok=True)

        unique_name = f"{uuid4()}.csv"
        file_path = os.path.join(user_folder, unique_name)

        content = await file.read()

        with open(file_path, "wb") as f:
            f.write(content)

        return {
            "original_name": file.filename,
            "saved_as": unique_name,
            "size": len(content)
        }

    # -------------------------
    # LIST FILES
    # -------------------------
    @staticmethod
    def list_files(user_id):
        user_folder = os.path.join(BASE_UPLOAD_DIR, str(user_id))

        if not os.path.exists(user_folder):
            return []

        return os.listdir(user_folder)

    # -------------------------
    # CSV → TASK CREATION 🔥 (FIXED)
    # -------------------------
    @staticmethod
    async def parse_csv_and_create_tasks(file, db, user_id):

        # 🔥 Read file ONLY ONCE
        content = await file.read()

        if not content:
            raise Exception("File is empty or already consumed")

        decoded = content.decode("utf-8")

        reader = csv.DictReader(StringIO(decoded))

        if not reader.fieldnames:
            raise Exception("Invalid CSV format")

        if "title" not in reader.fieldnames:
            raise Exception("CSV must contain 'title' column")

        created_count = 0
        errors = []

        for idx, row in enumerate(reader, start=1):
            try:
                # 🔥 Debug (optional)
                # print("ROW:", row)

                title = row.get("title", "").strip()
                if not title:
                    raise ValueError("Title cannot be empty")

                description = row.get("description")
                if description == "":
                    description = None

                # 🔥 Normalize status
                status = row.get("status", "pending")
                status = status.strip().lower().replace(" ", "_")

                valid_status = [s.value for s in TaskStatus]
                if status not in valid_status:
                    status = "pending"

                task = Task(
                    title=title,
                    description=description,
                    status=status,
                    user_id=user_id
                )

                db.add(task)
                created_count += 1

            except Exception as e:
                errors.append(f"Row {idx}: {str(e)}")

        db.commit()
        TaskService._invalidate_list_cache(user_id) 
        return {
            "created": created_count,
            "errors": errors
        }
