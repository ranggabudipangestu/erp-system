import uuid
from typing import Generic, TypeVar, Any
from pydantic import BaseModel, Field

T = TypeVar("T")

class ErrorDetail(BaseModel):
    field: str
    message: str

class ErrorResponse(BaseModel):
    code: str
    message: str
    errors: list[ErrorDetail] = Field(default_factory=list)

class ApiResponse(BaseModel, Generic[T]):
    traceId: str = Field(default_factory=lambda: str(uuid.uuid4()))
    metadata: dict[str, Any] | None = None
    error: ErrorResponse | None = None
    result: T | None = None

def success_response(result: T, metadata: dict[str, Any] | None = None, trace_id: str | None = None) -> ApiResponse[T]:
    """Helper to create a successful API response envelope."""
    return ApiResponse(
        traceId=trace_id or str(uuid.uuid4()),
        metadata=metadata,
        error=None,
        result=result
    )
