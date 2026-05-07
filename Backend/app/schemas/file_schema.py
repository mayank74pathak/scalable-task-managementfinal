from pydantic import BaseModel


class FileUploadResponse(BaseModel):
    original_name: str
    saved_as: str
    size: int


class FileListResponse(BaseModel):
    files: list[str]


class CSVImportResponse(BaseModel):
    created: int
    errors: list[str]