from fastapi import FastAPI, HTTPException, Path, UploadFile, File
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

app = FastAPI(
    title="Scalable Task Management Backend",
    version="1.0.0"
)

# ----------------------------
# In-memory storage
# ----------------------------
tasks = []
task_id_counter = 1


# ----------------------------
# Schemas / Models
# ----------------------------
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value):
        if not value.strip():
            raise ValueError("Title cannot be empty or spaces only")
        return value


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool


# ----------------------------
# Health & Root
# ----------------------------
@app.get("/")
def root():
    return {"message": "FastAPI app is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


# ----------------------------
# CREATE task
# ----------------------------
@app.post("/tasks", response_model=TaskResponse, tags=["Tasks"])
def create_task(task: TaskCreate):
    global task_id_counter

    new_task = {
        "id": task_id_counter,
        "title": task.title,
        "description": task.description,
        "completed": False
    }

    tasks.append(new_task)
    task_id_counter += 1
    return new_task


# ----------------------------
# READ all tasks (with pagination)
# ----------------------------
@app.get("/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def get_all_tasks(skip: int = 0, limit: int = 10):
    return tasks[skip : skip + limit]


# ----------------------------
# READ task by ID
# ----------------------------
@app.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_task(task_id: int = Path(..., gt=0)):
    for task in tasks:
        if task["id"] == task_id:
            return task

    raise HTTPException(status_code=404, detail="Task not found")


# ----------------------------
# UPDATE task
# ----------------------------
@app.put("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def update_task(
    task_id: int = Path(..., gt=0),
    task_data: TaskCreate = ...
):
    for task in tasks:
        if task["id"] == task_id:
            task["title"] = task_data.title
            task["description"] = task_data.description
            return task

    raise HTTPException(status_code=404, detail="Task not found")


# ----------------------------
# DELETE task
# ----------------------------
@app.delete("/tasks/{task_id}", tags=["Tasks"])
def delete_task(task_id: int = Path(..., gt=0)):
    for index, task in enumerate(tasks):
        if task["id"] == task_id:
            tasks.pop(index)
            return {"message": "Task deleted successfully"}

    raise HTTPException(status_code=404, detail="Task not found")


# ----------------------------
# FILE UPLOAD / INPUT INGESTION
# ----------------------------
@app.post("/tasks/upload", tags=["File Upload"])
async def upload_tasks(file: UploadFile = File(...)):
    
    # 1️⃣ Check file extension
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are allowed"
        )
    
    # 2️⃣ Optional: Check MIME type
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Upload a valid PDF file"
        )

    # 3️⃣ Read file content
    content = await file.read()

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "size_in_bytes": len(content)
    }