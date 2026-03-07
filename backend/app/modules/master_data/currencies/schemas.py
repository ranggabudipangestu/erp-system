from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field


class CurrencyBase(BaseModel):
    code: str = Field(..., max_length=10, description="Currency Code (e.g. IDR, USD)")
    name: str = Field(..., max_length=100, description="Currency Name (e.g. Indonesian Rupiah)")
    symbol: str = Field(..., max_length=10, description="Currency Symbol (e.g. Rp, $)")
    exchange_rate: Decimal = Field(1, ge=0, description="Exchange rate")


class CurrencyCreateRequest(CurrencyBase):
    pass


class CurrencyUpdateRequest(CurrencyBase):
    pass


class CurrencyDto(CurrencyBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    deleted_at: datetime | None
    created_at: datetime
    updated_at: datetime | None
    created_by: str
    updated_by: str | None


class CurrencyListResponse(BaseModel):
    items: list[CurrencyDto]
    total: int
    page: int
    size: int
