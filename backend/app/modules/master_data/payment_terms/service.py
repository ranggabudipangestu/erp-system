from __future__ import annotations

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from .models import PaymentTerm
from .repository import PaymentTermRepository
from .schemas import (
    PaymentTermDto,
    CreatePaymentTermDto,
    UpdatePaymentTermDto,
    PaymentTermListResponse,
    PaymentTermImportSummary,
)


class PaymentTermService:
    def __init__(self, repository: PaymentTermRepository):
        self.repository = repository

    def create_payment_term(self, tenant_id: UUID, payload: CreatePaymentTermDto) -> PaymentTermDto:
        # Check for duplicate code
        existing = self.repository.get_by_code(tenant_id, payload.code)
        if existing:
            raise ValueError(f"Payment term with code '{payload.code}' already exists")

        payment_term = PaymentTerm(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            description=payload.description,
            due_days=payload.due_days,
            early_payment_discount_percent=payload.early_payment_discount_percent,
            early_payment_discount_days=payload.early_payment_discount_days,
            created_by=payload.created_by,
        )

        created = self.repository.create(payment_term)
        return PaymentTermDto.model_validate(created)

    def get_payment_term(self, tenant_id: UUID, payment_term_id: UUID) -> Optional[PaymentTermDto]:
        payment_term = self.repository.get_by_id(tenant_id, payment_term_id)
        if not payment_term:
            return None
        return PaymentTermDto.model_validate(payment_term)

    def update_payment_term(
        self, tenant_id: UUID, payment_term_id: UUID, payload: UpdatePaymentTermDto
    ) -> PaymentTermDto:
        payment_term = self.repository.get_by_id(tenant_id, payment_term_id)
        if not payment_term:
            raise ValueError(f"Payment term with ID {payment_term_id} not found")

        # Check for duplicate code (if changed)
        if payload.code != payment_term.code:
            existing = self.repository.get_by_code(tenant_id, payload.code)
            if existing:
                raise ValueError(f"Payment term with code '{payload.code}' already exists")

        # Update fields
        payment_term.code = payload.code
        payment_term.name = payload.name
        payment_term.description = payload.description
        payment_term.due_days = payload.due_days
        payment_term.early_payment_discount_percent = payload.early_payment_discount_percent
        payment_term.early_payment_discount_days = payload.early_payment_discount_days
        payment_term.updated_by = payload.updated_by
        payment_term.updated_at = datetime.utcnow()

        updated = self.repository.update(payment_term)
        return PaymentTermDto.model_validate(updated)

    def archive_payment_term(self, tenant_id: UUID, payment_term_id: UUID) -> bool:
        payment_term = self.repository.get_by_id(tenant_id, payment_term_id)
        if not payment_term:
            return False

        self.repository.archive(payment_term)
        return True

    def list_payment_terms(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> PaymentTermListResponse:
        items, total = self.repository.list(
            tenant_id=tenant_id,
            search=search,
            page=page,
            page_size=page_size,
            include_archived=include_archived,
        )

        total_pages = (total + page_size - 1) // page_size if total > 0 else 1

        return PaymentTermListResponse(
            items=[PaymentTermDto.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )

    def export_payment_terms(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        include_archived: bool = False,
    ) -> List[PaymentTermDto]:
        items, _ = self.repository.list(
            tenant_id=tenant_id,
            search=search,
            page=1,
            page_size=1000,  # Large page size for export
            include_archived=include_archived,
        )
        return [PaymentTermDto.model_validate(item) for item in items]