from __future__ import annotations

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from .models import Currency


class CurrencyRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, currency: Currency) -> Currency:
        self.session.add(currency)
        self.session.flush()
        self.session.refresh(currency)
        return currency

    def get_by_id(self, tenant_id: UUID, currency_id: UUID) -> Optional[Currency]:
        return (
            self.session.query(Currency)
            .filter(
                and_(
                    Currency.id == currency_id,
                    Currency.tenant_id == tenant_id,
                    Currency.deleted_at.is_(None),
                )
            )
            .first()
        )

    def get_by_code(self, tenant_id: UUID, code: str) -> Optional[Currency]:
        """Find a currency by code, including archived ones."""
        return (
            self.session.query(Currency)
            .filter(
                and_(
                    Currency.code == code,
                    Currency.tenant_id == tenant_id,
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
    ) -> tuple[List[Currency], int]:
        query = self.session.query(Currency).filter(Currency.tenant_id == tenant_id)

        if not include_archived:
            query = query.filter(Currency.deleted_at.is_(None))

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Currency.code.ilike(search_term),
                    Currency.name.ilike(search_term),
                )
            )

        total = query.count()
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total

    def update(self, currency: Currency) -> Currency:
        self.session.flush()
        self.session.refresh(currency)
        return currency

    def archive(self, currency: Currency) -> Currency:
        currency.deleted_at = datetime.now(timezone.utc)
        self.session.flush()
        return currency
