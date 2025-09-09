from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional


class ReportingTemplateDto(BaseModel):
    id: int
    tenant_id: str
    template_type: str
    version: int
    file_path: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateUploadResponse(BaseModel):
    id: int
    tenant_id: str
    template_type: str
    version: int
    message: str


class TemplateHistoryResponse(BaseModel):
    templates: List[ReportingTemplateDto]


class ActivateTemplateRequest(BaseModel):
    version: int


class PreviewTemplateRequest(BaseModel):
    version: Optional[int] = None