from __future__ import annotations

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from app.core.db import Base
from .models import Unit


class UnitRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, unit: Unit) -> Unit:
        self.session.add(unit)
        self.session.flush()
        self.session.refresh(unit)
        return unit

    def get_by_id(self, tenant_id: UUID, unit_id: UUID) -> Optional[Unit]:
        return (
            self.session.query(Unit)
            .filter(
                and_(
                    Unit.id == unit_id,
                    Unit.tenant_id == tenant_id,
                    Unit.deleted_at.is_(None),
                )
            )
            .first()
        )

    def get_by_code(self, tenant_id: UUID, code: str) -> Optional[Unit]:
        """Find a unit by code, including archived ones (for unique constraint validation)."""
        return (
            self.session.query(Unit)
            .filter(
                and_(
                    Unit.code == code,
                    Unit.tenant_id == tenant_id,
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
    ) -> tuple[List[Unit], int]:
        query = self.session.query(Unit).filter(Unit.tenant_id == tenant_id)

        if not include_archived:
            query = query.filter(Unit.deleted_at.is_(None))

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    Unit.code.ilike(search_term),
                    Unit.name.ilike(search_term),
                )
            )

        total = query.count()
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total

    def update(self, unit: Unit) -> Unit:
        self.session.flush()
        self.session.refresh(unit)
        return unit

    def archive(self, unit: Unit) -> Unit:
        unit.deleted_at = datetime.now(timezone.utc)
        self.session.flush()
        return unit
