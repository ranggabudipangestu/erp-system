from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.core.db import Base
from .models import PaymentTerm


class PaymentTermRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, payment_term: PaymentTerm) -> PaymentTerm:
        self.session.add(payment_term)
        self.session.flush()
        self.session.refresh(payment_term)
        return payment_term

    def get_by_id(self, tenant_id: UUID, payment_term_id: UUID) -> Optional[PaymentTerm]:
        return (
            self.session.query(PaymentTerm)
            .filter(
                and_(
                    PaymentTerm.id == payment_term_id,
                    PaymentTerm.tenant_id == tenant_id,
                    PaymentTerm.deleted_at.is_(None),
                )
            )
            .first()
        )

    def get_by_code(self, tenant_id: UUID, code: str) -> Optional[PaymentTerm]:
        return (
            self.session.query(PaymentTerm)
            .filter(
                and_(
                    PaymentTerm.code == code,
                    PaymentTerm.tenant_id == tenant_id,
                    PaymentTerm.deleted_at.is_(None),
                )
            )
            .first()
        )

    def list(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> tuple[List[PaymentTerm], int]:
        query = self.session.query(PaymentTerm).filter(PaymentTerm.tenant_id == tenant_id)

        if not include_archived:
            query = query.filter(PaymentTerm.deleted_at.is_(None))

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    PaymentTerm.code.ilike(search_term),
                    PaymentTerm.name.ilike(search_term),
                    PaymentTerm.description.ilike(search_term),
                )
            )

        total = query.count()
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total

    def update(self, payment_term: PaymentTerm) -> PaymentTerm:
        self.session.flush()
        self.session.refresh(payment_term)
        return payment_term

    def archive(self, payment_term: PaymentTerm) -> PaymentTerm:
        from datetime import datetime, timezone

        payment_term.deleted_at = datetime.now(timezone.utc)
        self.session.flush()
        return payment_term

    def get_total_count(self, tenant_id: UUID, include_archived: bool = False) -> int:
        query = self.session.query(func.count(PaymentTerm.id)).filter(PaymentTerm.tenant_id == tenant_id)

        if not include_archived:
            query = query.filter(PaymentTerm.deleted_at.is_(None))

        return query.scalar()