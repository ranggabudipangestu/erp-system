from datetime import datetime
from typing import Optional
from uuid import UUID
from decimal import Decimal

from pydantic import BaseModel


class ProductDto(BaseModel):
    id: UUID
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[UUID] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    price: Decimal
    cost_price: Decimal
    stock_quantity: int
    minimum_stock: int
    is_active: bool
    image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    updated_by: Optional[str] = None


class CreateProductDto(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    category: Optional[UUID] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    price: Decimal
    cost_price: Decimal
    stock_quantity: int
    minimum_stock: int
    is_active: bool = True
    image_url: Optional[str] = None
    created_by: str


class UpdateProductDto(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[UUID] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    price: Decimal
    cost_price: Decimal
    stock_quantity: int
    minimum_stock: int
    is_active: bool
    image_url: Optional[str] = None
    updated_by: str

