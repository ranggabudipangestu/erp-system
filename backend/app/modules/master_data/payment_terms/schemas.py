from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class PaymentTermBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    due_days: int = Field(..., gt=0)
    early_payment_discount_percent: Optional[Decimal] = Field(None, ge=0, le=100)
    early_payment_discount_days: Optional[int] = Field(None, gt=0)

    @model_validator(mode="after")
    def validate_early_payment_discount(self) -> "PaymentTermBase":
        pct = self.early_payment_discount_percent
        days = self.early_payment_discount_days
        if pct is not None and days is None:
            raise ValueError("Early payment discount days must be specified when discount percent is provided")
        if days is not None and pct is None:
            raise ValueError("Early payment discount percent must be specified when discount days are provided")
        return self


class CreatePaymentTermDto(PaymentTermBase):
    created_by: str = Field(..., max_length=100)


class UpdatePaymentTermDto(PaymentTermBase):
    updated_by: str = Field(..., max_length=100)


class PaymentTermDto(PaymentTermBase):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    tenant_id: UUID
    # Maps from `deleted_at` column in PaymentTerm model
    archived_at: Optional[datetime] = Field(None, alias="deleted_at")
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    updated_by: Optional[str] = None


class PaymentTermListResponse(BaseModel):
    items: list[PaymentTermDto]
    total: int
    page: int
    page_size: int
    total_pages: int


class PaymentTermImportSummary(BaseModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = Field(default_factory=list)