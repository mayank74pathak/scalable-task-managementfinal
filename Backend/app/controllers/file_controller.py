from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.services.file_service import FileService
from app.schemas.file_schema import FileUploadResponse, FileListResponse, CSVImportResponse
from app.dependencies.auth_dependencies import get_current_user
from app.database import get_db
from app.utils.logger import logger

router = APIRouter(
    prefix="/files",
    tags=["Files"],
    dependencies=[Depends(get_current_user)]
)


@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    try:
        result = await FileService.save_file(
            file,
            current_user.id
        )
        logger.info(f"File uploaded successfully: {result['saved_as']} by {current_user.email}")
        return result

    except Exception as e:
        logger.error(f"Error occurred while uploading file: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=FileListResponse)
async def list_files(
    current_user = Depends(get_current_user)
):
    return {
        "files": FileService.list_files(current_user.id)
    }


# 🔥 NEW — CSV → Tasks import
@router.post("/import-tasks", response_model=CSVImportResponse)
async def import_tasks_from_csv(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")

    try:
        result = await FileService.parse_csv_and_create_tasks(
            file=file,
            db=db,
            user_id=current_user.id
        )

        logger.info(
            f"CSV import by {current_user.email}: "
            f"{result['created']} tasks created, {len(result['errors'])} errors"
        )

        return result

    except Exception as e:
        logger.error(f"CSV import failed for {current_user.email}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))