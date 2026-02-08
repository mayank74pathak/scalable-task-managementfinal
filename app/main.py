from fastapi import FastAPI, HTTPException, Path, UploadFile, File, Depends
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from sqlalchemy.orm import Session
import os
from uuid import uuid4


from app.database import SessionLocal, engine, Base
from app.models import Task

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Scalable Task Management Backend",
    version="1.0.0"
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
# ----------------------------
# DB Dependency
# ----------------------------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------------------
# Schemas
# ----------------------------
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: Optional[str] = Field(None, max_length=500)

    @field_validator("title")
    @classmethod
    def title_not_blank(cls, value):
        if not value.strip():
            raise ValueError("Title cannot be empty")
        return value


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool

    class Config:
        from_attributes = True   # important for ORM

# ----------------------------
# Health
# ----------------------------
@app.get("/")
def root():
    return {"message": "FastAPI app is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}

# ----------------------------
# CREATE Task (DB)
# ----------------------------
@app.post("/tasks", response_model=TaskResponse, tags=["Tasks"])
def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    new_task = Task(
        title=task.title,
        description=task.description
    )
    db.add(new_task)
    db.commit()
    db.refresh(new_task)
    return new_task

# ----------------------------
# READ Tasks (Pagination)
# ----------------------------
@app.get("/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def get_all_tasks(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    return db.query(Task).offset(skip).limit(limit).all()

# ----------------------------
# READ Task by ID
# ----------------------------
@app.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_task(task_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task
# ----------------------------
# UPDATE Task
# ----------------------------
@app.put("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def update_task(
    task_id: int = Path(..., gt=0),
    task_data: TaskCreate = ...,
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id).first()

    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    task.title = task_data.title
    task.description = task_data.description

    db.commit()
    db.refresh(task)
    return task

# ----------------------------
# DELETE Task
# ----------------------------
@app.delete("/tasks/{task_id}", tags=["Tasks"])
def delete_task(task_id: int = Path(..., gt=0), db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(task)
    db.commit()
    return {"message": "Task deleted successfully"}


# ----------------------------
# UPLOAD PDF File
# ----------------------------
@app.post("/upload-pdf", tags=["File Upload"])
async def upload_pdf(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    # Validate content type
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="Invalid file type. Must be PDF")
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        return {
            "message": "PDF uploaded successfully",
            "filename": file.filename,
            "saved_as": unique_filename,
            "file_path": file_path,
            "file_size": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

# ----------------------------
# GET Uploaded Files List
# ----------------------------
@app.get("/uploaded-files", tags=["File Upload"])
def get_uploaded_files():
    if not os.path.exists(UPLOAD_DIR):
        return {"files": []}
    
    files = []
    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            files.append({
                "filename": filename,
                "size": os.path.getsize(file_path),
                "path": file_path
            })
    
    return {"files": files, "total": len(files)}