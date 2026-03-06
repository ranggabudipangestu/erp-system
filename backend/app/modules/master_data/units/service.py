from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from .models import Unit
from .repository import UnitRepository
from .schemas import (
    UnitDto,
    UnitCreateRequest,
    UnitUpdateRequest,
    UnitListResponse,
)


class UnitService:
    def __init__(self, repository: UnitRepository):
        self.repository = repository

    def create_unit(self, tenant_id: UUID, payload: UnitCreateRequest, created_by: str) -> UnitDto:
        # Check for duplicate code
        existing = self.repository.get_by_code(tenant_id, payload.code)
        if existing:
            raise ValueError(f"Unit with code '{payload.code}' already exists")

        unit = Unit(
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            value=payload.value,
            created_by=created_by,
        )

        created = self.repository.create(unit)
        return UnitDto.model_validate(created)

    def get_unit(self, tenant_id: UUID, unit_id: UUID) -> Optional[UnitDto]:
        unit = self.repository.get_by_id(tenant_id, unit_id)
        if not unit:
            return None
        return UnitDto.model_validate(unit)

    def update_unit(
        self, tenant_id: UUID, unit_id: UUID, payload: UnitUpdateRequest, updated_by: str
    ) -> UnitDto:
        unit = self.repository.get_by_id(tenant_id, unit_id)
        if not unit:
            raise ValueError(f"Unit with ID {unit_id} not found")

        # Check for duplicate code (if changed)
        if payload.code != unit.code:
            existing = self.repository.get_by_code(tenant_id, payload.code)
            if existing:
                raise ValueError(f"Unit with code '{payload.code}' already exists")

        # Update fields
        unit.code = payload.code
        unit.name = payload.name
        unit.value = payload.value
        unit.updated_by = updated_by

        updated = self.repository.update(unit)
        return UnitDto.model_validate(updated)

    def archive_unit(self, tenant_id: UUID, unit_id: UUID) -> bool:
        unit = self.repository.get_by_id(tenant_id, unit_id)
        if not unit:
            return False

        self.repository.archive(unit)
        return True

    def list_units(
        self,
        tenant_id: UUID,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 25,
        include_archived: bool = False,
    ) -> UnitListResponse:
        items, total = self.repository.list(
            tenant_id=tenant_id,
            search=search,
            page=page,
            page_size=page_size,
            include_archived=include_archived,
        )

        return UnitListResponse(
            items=[UnitDto.model_validate(item) for item in items],
            total=total,
            page=page,
            size=page_size,
        )
