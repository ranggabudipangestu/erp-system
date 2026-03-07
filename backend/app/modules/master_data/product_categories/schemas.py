from __future__ import annotations

from datetime import datetime
from uuid import UUID
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ProductCategoryBase(BaseModel):
    code: str = Field(..., max_length=50, description="Category code (e.g. ELEC, FOOD)")
    name: str = Field(..., max_length=100, description="Category name")
    description: Optional[str] = Field(None, max_length=500, description="Category description")
    parent_id: Optional[UUID] = Field(None, description="Parent category ID for hierarchy")


class ProductCategoryCreateRequest(ProductCategoryBase):
    pass


class ProductCategoryUpdateRequest(ProductCategoryBase):
    pass


class ProductCategoryDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    code: str
    name: str
    description: Optional[str]
    parent_id: Optional[UUID]
    deleted_at: Optional[datetime]
    created_at: datetime
    updated_at: Optional[datetime]
    created_by: str
    updated_by: Optional[str]


class ProductCategoryTreeDto(ProductCategoryDto):
    children: list["ProductCategoryTreeDto"] = []


class ProductCategoryListResponse(BaseModel):
    items: list[ProductCategoryDto]
    total: int
    page: int
    size: int
