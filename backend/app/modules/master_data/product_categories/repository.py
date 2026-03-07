from __future__ import annotations

from typing import List, Optional
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.modules.master_data.product.models import ProductCategory


class ProductCategoryRepository:
    def __init__(self, session: Session):
        self.session = session

    def create(self, category: ProductCategory) -> ProductCategory:
        self.session.add(category)
        self.session.flush()
        self.session.refresh(category)
        return category

    def get_by_id(self, tenant_id: UUID, category_id: UUID) -> Optional[ProductCategory]:
        return (
            self.session.query(ProductCategory)
            .filter(
                and_(
                    ProductCategory.id == category_id,
                    ProductCategory.tenant_id == tenant_id,
                    ProductCategory.deleted_at.is_(None),
                )
            )
            .first()
        )

    def get_by_code(self, tenant_id: UUID, code: str) -> Optional[ProductCategory]:
        """Find a category by code, including archived ones (for unique constraint validation)."""
        return (
            self.session.query(ProductCategory)
            .filter(
                and_(
                    ProductCategory.code == code,
                    ProductCategory.tenant_id == tenant_id,
                )
            )
            .first()
        )

    def list(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        parent_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> tuple[List[ProductCategory], int]:
        query = self.session.query(ProductCategory).filter(ProductCategory.tenant_id == tenant_id)

        if not include_archived:
            query = query.filter(ProductCategory.deleted_at.is_(None))

        if parent_id is not None:
            query = query.filter(ProductCategory.parent_id == parent_id)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    ProductCategory.code.ilike(search_term),
                    ProductCategory.name.ilike(search_term),
                )
            )

        total = query.count()
        offset = (page - 1) * page_size
        items = query.order_by(ProductCategory.code).offset(offset).limit(page_size).all()

        return items, total

    def get_all_active(self, tenant_id: UUID) -> List[ProductCategory]:
        """Get all active categories for tree building."""
        return (
            self.session.query(ProductCategory)
            .filter(
                and_(
                    ProductCategory.tenant_id == tenant_id,
                    ProductCategory.deleted_at.is_(None),
                )
            )
            .order_by(ProductCategory.code)
            .all()
        )

    def update(self, category: ProductCategory) -> ProductCategory:
        self.session.flush()
        self.session.refresh(category)
        return category

    def archive(self, category: ProductCategory) -> ProductCategory:
        category.deleted_at = datetime.now(timezone.utc)
        self.session.flush()
        return category
