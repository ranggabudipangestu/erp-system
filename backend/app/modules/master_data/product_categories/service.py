from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from app.modules.master_data.product.models import ProductCategory
from .repository import ProductCategoryRepository
from .schemas import (
    ProductCategoryDto,
    ProductCategoryTreeDto,
    ProductCategoryCreateRequest,
    ProductCategoryUpdateRequest,
    ProductCategoryListResponse,
)

logger = logging.getLogger(__name__)


class ProductCategoryService:
    def __init__(self, repository: ProductCategoryRepository):
        self.repository = repository

    def create_category(
        self, tenant_id: UUID, payload: ProductCategoryCreateRequest, created_by: str
    ) -> ProductCategoryDto:
        # Check for duplicate code
        existing = self.repository.get_by_code(tenant_id, payload.code)
        if existing:
            raise ValueError(f"Product category with code '{payload.code}' already exists")

        # Validate parent exists if provided
        if payload.parent_id:
            parent = self.repository.get_by_id(tenant_id, payload.parent_id)
            if not parent:
                raise ValueError("Parent category not found")

        category = ProductCategory(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            description=payload.description,
            parent_id=payload.parent_id,
            created_by=created_by,
        )

        created = self.repository.create(category)
        return ProductCategoryDto.model_validate(created)

    def get_category(self, tenant_id: UUID, category_id: UUID) -> Optional[ProductCategoryDto]:
        category = self.repository.get_by_id(tenant_id, category_id)
        if not category:
            return None
        return ProductCategoryDto.model_validate(category)

    def update_category(
        self,
        tenant_id: UUID,
        category_id: UUID,
        payload: ProductCategoryUpdateRequest,
        updated_by: str,
    ) -> ProductCategoryDto:
        category = self.repository.get_by_id(tenant_id, category_id)
        if not category:
            raise ValueError(f"Product category with ID {category_id} not found")

        # Check for duplicate code (if changed)
        if payload.code != category.code:
            existing = self.repository.get_by_code(tenant_id, payload.code)
            if existing:
                raise ValueError(f"Product category with code '{payload.code}' already exists")

        # Validate parent
        if payload.parent_id:
            if payload.parent_id == category_id:
                raise ValueError("A category cannot be its own parent")
            parent = self.repository.get_by_id(tenant_id, payload.parent_id)
            if not parent:
                raise ValueError("Parent category not found")
            # Check for circular reference
            if self._would_create_cycle(tenant_id, category_id, payload.parent_id):
                raise ValueError("Cannot set parent: would create a circular reference")

        category.code = payload.code
        category.name = payload.name
        category.description = payload.description
        category.parent_id = payload.parent_id
        category.updated_by = updated_by

        updated = self.repository.update(category)
        return ProductCategoryDto.model_validate(updated)

    def archive_category(self, tenant_id: UUID, category_id: UUID) -> bool:
        category = self.repository.get_by_id(tenant_id, category_id)
        if not category:
            return False
        self.repository.archive(category)
        return True

    def list_categories(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        parent_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> ProductCategoryListResponse:
        items, total = self.repository.list(
            tenant_id=tenant_id,
            search=search,
            parent_id=parent_id,
            page=page,
            page_size=page_size,
            include_archived=include_archived,
        )

        return ProductCategoryListResponse(
            items=[ProductCategoryDto.model_validate(item) for item in items],
            total=total,
            page=page,
            size=page_size,
        )

    def get_tree(self, tenant_id: UUID) -> list[ProductCategoryTreeDto]:
        """Build hierarchical tree of all active categories."""
        all_categories = self.repository.get_all_active(tenant_id)

        # Build lookup
        by_id: dict[UUID, ProductCategoryTreeDto] = {}
        for cat in all_categories:
            dto = ProductCategoryTreeDto.model_validate(cat)
            dto.children = []
            by_id[cat.id] = dto

        # Build tree
        roots: list[ProductCategoryTreeDto] = []
        for dto in by_id.values():
            if dto.parent_id and dto.parent_id in by_id:
                by_id[dto.parent_id].children.append(dto)
            else:
                roots.append(dto)

        return roots

    def _would_create_cycle(
        self, tenant_id: UUID, category_id: UUID, new_parent_id: UUID
    ) -> bool:
        """Check if setting new_parent_id would create a circular parent chain."""
        visited = {category_id}
        current_id = new_parent_id

        while current_id:
            if current_id in visited:
                return True
            visited.add(current_id)
            parent = self.repository.get_by_id(tenant_id, current_id)
            if not parent:
                break
            current_id = parent.parent_id

        return False
