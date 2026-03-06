from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class UnitBase(BaseModel):
    code: str = Field(..., max_length=50, description="Unit Code (e.g. PCS, BOX40)")
    name: str = Field(..., max_length=100, description="Unit Name (e.g. Pieces, Box 40)")
    value: Decimal = Field(1, ge=0, description="Unit value (e.g. 1 for PCS, 40 for BOX40)")


class UnitCreateRequest(UnitBase):
    pass


class UnitUpdateRequest(UnitBase):
    pass


class UnitDto(UnitBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    created_by: str
    updated_by: str | None


class UnitListResponse(BaseModel):
    items: list[UnitDto]
    total: int
    page: int
    size: int
