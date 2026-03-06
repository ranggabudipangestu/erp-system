from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from sqlalchemy import and_, or_, func
from sqlalchemy.orm import Session

from .models import ChartOfAccount


class ChartOfAccountRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, account: ChartOfAccount) -> ChartOfAccount:
        self.session.add(account)
        self.session.flush()
        self.session.refresh(account)
        return account

    def create_many(self, accounts: List[ChartOfAccount]) -> List[ChartOfAccount]:
        self.session.add_all(accounts)
        self.session.flush()
        return accounts

    def get_by_id(self, tenant_id: UUID, account_id: UUID) -> Optional[ChartOfAccount]:
        return (
            self.session.query(ChartOfAccount)
            .filter(
                and_(
                    ChartOfAccount.id == account_id,
                    ChartOfAccount.tenant_id == tenant_id,
                    ChartOfAccount.deleted_at.is_(None),
                )
            )
            .first()
        )

    def get_by_code(self, tenant_id: UUID, code: str) -> Optional[ChartOfAccount]:
        return (
            self.session.query(ChartOfAccount)
            .filter(
                and_(
                    ChartOfAccount.code == code,
                    ChartOfAccount.tenant_id == tenant_id,
                    ChartOfAccount.deleted_at.is_(None),
                )
            )
            .first()
        )

    def list(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        account_type: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> tuple[List[ChartOfAccount], int]:
        query = self.session.query(ChartOfAccount).filter(ChartOfAccount.tenant_id == tenant_id)

        if not include_archived:
            query = query.filter(ChartOfAccount.deleted_at.is_(None))

        if account_type:
            query = query.filter(ChartOfAccount.account_type == account_type)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    ChartOfAccount.code.ilike(search_term),
                    ChartOfAccount.name.ilike(search_term),
                    ChartOfAccount.description.ilike(search_term),
                )
            )

        query = query.order_by(ChartOfAccount.code)
        total = query.count()
        offset = (page - 1) * page_size
        items = query.offset(offset).limit(page_size).all()

        return items, total

    def get_all_for_tree(self, tenant_id: UUID, include_archived: bool = False) -> List[ChartOfAccount]:
        """Fetch all accounts for a tenant to build a tree in memory."""
        query = self.session.query(ChartOfAccount).filter(ChartOfAccount.tenant_id == tenant_id)
        if not include_archived:
            query = query.filter(ChartOfAccount.deleted_at.is_(None))
        return query.order_by(ChartOfAccount.code).all()

    def get_children(self, tenant_id: UUID, parent_id: UUID) -> List[ChartOfAccount]:
        return (
            self.session.query(ChartOfAccount)
            .filter(
                and_(
                    ChartOfAccount.tenant_id == tenant_id,
                    ChartOfAccount.parent_id == parent_id,
                    ChartOfAccount.deleted_at.is_(None),
                )
            )
            .all()
        )

    def update(self, account: ChartOfAccount) -> ChartOfAccount:
        self.session.flush()
        self.session.refresh(account)
        return account

    def archive(self, account: ChartOfAccount) -> ChartOfAccount:
        from datetime import datetime, timezone
        account.deleted_at = datetime.now(timezone.utc)
        self.session.flush()
        return account

    def has_active_children(self, tenant_id: UUID, account_id: UUID) -> bool:
        count = (
            self.session.query(func.count(ChartOfAccount.id))
            .filter(
                and_(
                    ChartOfAccount.tenant_id == tenant_id,
                    ChartOfAccount.parent_id == account_id,
                    ChartOfAccount.deleted_at.is_(None),
                )
            )
            .scalar()
        )
        return (count or 0) > 0

    def count_by_tenant(self, tenant_id: UUID) -> int:
        return (
            self.session.query(func.count(ChartOfAccount.id))
            .filter(
                and_(
                    ChartOfAccount.tenant_id == tenant_id,
                    ChartOfAccount.deleted_at.is_(None),
                )
            )
            .scalar()
            or 0
        )
