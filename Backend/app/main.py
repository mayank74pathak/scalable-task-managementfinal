from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware  # ← ADD THIS
from app.database import engine
from app.models import Base
from app.controllers.task_controller import router as task_router
from app.controllers.auth_controller import router as auth_router
from app.controllers.file_controller import router as file_router

import time

from app.utils.logger import logger

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Management API")

# -------------------------
# CORS Middleware          ← ADD THIS BLOCK
# -------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://scalable-task-managementfinal.vercel.app"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Logging Middleware
# -------------------------
@app.middleware("http")
async def log_requests(request: Request, call_next):

    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    logger.info(
        f"{request.method} {request.url.path} | "
        f"Status: {response.status_code} | "
        f"Time: {process_time:.4f}s"
    )

    return response


# API Versioning
app.include_router(auth_router, prefix="/api/v1")
app.include_router(task_router, prefix="/api/v1")
app.include_router(file_router, prefix="/api/v1")


@app.get("/")
def health():
    logger.info("Health check endpoint called")
    return {"message": "API is running"}
# API Versioning
app.include_router(auth_router, prefix="/api/v1")
app.include_router(task_router, prefix="/api/v1")
app.include_router(file_router, prefix="/api/v1")


@app.get("/")
def health():
    logger.info("Health check endpoint called")
    return {"message": "API is running"}