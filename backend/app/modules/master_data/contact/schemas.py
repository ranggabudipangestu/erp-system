from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator, field_validator


VALID_ROLES = {"Customer", "Supplier", "Employee"}


class ContactBase(BaseModel):
    code: str = Field(..., max_length=50)
    name: str = Field(..., max_length=200)
    email: Optional[str] = Field(None, max_length=150)
    phone: Optional[str] = Field(None, max_length=50)
    address_billing: Optional[str] = None
    address_shipping: Optional[str] = None
    tax_number: Optional[str] = Field(None, max_length=50)
    roles: List[str]

    credit_limit: Optional[Decimal] = None
    distribution_channel: Optional[str] = Field(None, max_length=100)
    pic_name: Optional[str] = Field(None, max_length=150)

    bank_account_number: Optional[str] = Field(None, max_length=100)
    payment_terms: Optional[str] = Field(None, max_length=100)
    sales_contact_name: Optional[str] = Field(None, max_length=150)

    employee_id: Optional[str] = Field(None, max_length=100)
    department: Optional[str] = Field(None, max_length=100)
    job_title: Optional[str] = Field(None, max_length=100)
    employment_status: Optional[str] = Field(None, max_length=50)

    @validator("roles")
    def validate_roles(cls, value: List[str]) -> List[str]:
        if not value:
            raise ValueError("At least one role must be specified")
        normalized = []
        for role in value:
            if role not in VALID_ROLES:
                raise ValueError(f"Invalid role '{role}'. Allowed values: {', '.join(sorted(VALID_ROLES))}")
            normalized.append(role)
        return normalized
    

class CreateContactDto(ContactBase):
    created_by: str = Field(..., max_length=100)


class UpdateContactDto(ContactBase):
    updated_by: str = Field(..., max_length=100)


class ContactDto(ContactBase):
    id: UUID
    tenant_id: UUID
    archived_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: str
    updated_by: Optional[str] = None

    class Config:
        orm_mode = True


class ContactListResponse(BaseModel):
    items: List[ContactDto]
    total: int
    page: int
    page_size: int
    total_pages: int


class ContactImportSummary(BaseModel):
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: List[str] = Field(default_factory=list)
