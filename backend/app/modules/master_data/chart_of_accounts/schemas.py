from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, model_validator


class AccountType(str, Enum):
    ASSET = "ASSET"
    LIABILITY = "LIABILITY"
    EQUITY = "EQUITY"
    REVENUE = "REVENUE"
    EXPENSE = "EXPENSE"


class NormalBalance(str, Enum):
    DEBIT = "DEBIT"
    CREDIT = "CREDIT"


class CreateChartOfAccountDto(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=200)
    account_type: AccountType
    normal_balance: NormalBalance
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    is_active: bool = True
    created_by: str = Field(..., max_length=100)


class UpdateChartOfAccountDto(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=200)
    account_type: AccountType
    normal_balance: NormalBalance
    parent_id: Optional[UUID] = None
    description: Optional[str] = None
    is_active: bool = True
    updated_by: str = Field(..., max_length=100)


class ChartOfAccountDto(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    tenant_id: UUID
    parent_id: Optional[UUID] = None
    code: str
    name: str
    account_type: AccountType
    normal_balance: NormalBalance
    level: int
    description: Optional[str] = None
    is_active: bool
    deleted_at: Optional[datetime] = Field(None, alias="deleted_at")
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    updated_by: Optional[str] = None


class ChartOfAccountTreeDto(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    tenant_id: UUID
    parent_id: Optional[UUID] = None
    code: str
    name: str
    account_type: AccountType
    normal_balance: NormalBalance
    level: int
    description: Optional[str] = None
    is_active: bool
    children: list[ChartOfAccountTreeDto] = Field(default_factory=list)


class ChartOfAccountListResponse(BaseModel):
    items: list[ChartOfAccountDto]
    total: int
    page: int
    page_size: int
    total_pages: int
