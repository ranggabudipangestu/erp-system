from __future__ import annotations

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.response import success_response, ApiResponse
from app.core.exceptions import ApiError, ResourceNotFoundError
from app.core.db import session_scope
from app.core.security import require_permissions, SecurityPrincipal

from .repository import UnitRepository
from .service import UnitService
from .schemas import (
    UnitDto,
    UnitCreateRequest,
    UnitUpdateRequest,
    UnitListResponse,
)

router = APIRouter()

logger = logging.getLogger(__name__)


def get_session():
    with session_scope() as session:
        yield session


def get_service(session=Depends(get_session)) -> UnitService:
    repo = UnitRepository(session)
    return UnitService(repo)


def _tenant_id(principal: SecurityPrincipal) -> UUID:
    return principal.tenant_id


@router.get("", response_model=ApiResponse[List[dict]])
def list_units(
    search: Optional[str] = Query(None, description="Search term for code or name"),
    include_archived: bool = Query(False, description="Include archived units"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    principal: SecurityPrincipal = Depends(require_permissions(["units.view"])),
    service: UnitService = Depends(get_service),
):
    payload: UnitListResponse = service.list_units(
        tenant_id=_tenant_id(principal),
        search=search,
        include_archived=include_archived,
        page=page,
        page_size=page_size,
    )
    
    total_pages = (payload.total + payload.size - 1) // payload.size if payload.total > 0 else 1
    
    return success_response(
        [item.model_dump() for item in payload.items],
        metadata={
            "total": payload.total,
            "page": payload.page,
            "pageSize": payload.size,
            "totalPages": total_pages,
            "hasNext": payload.page < total_pages,
            "hasPrev": payload.page > 1,
        },
    )


@router.get("/{unit_id}", response_model=ApiResponse[dict])
def get_unit(
    unit_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["units.view"])),
    service: UnitService = Depends(get_service),
):
    unit = service.get_unit(_tenant_id(principal), unit_id)
    if not unit:
        raise ResourceNotFoundError("Unit not found")
    return success_response(unit.model_dump())


@router.post("", status_code=201, response_model=ApiResponse[dict])
def create_unit(
    payload: UnitCreateRequest,
    principal: SecurityPrincipal = Depends(require_permissions(["units.create"])),
    service: UnitService = Depends(get_service),
):
    try:
        actor = getattr(principal, "email", "system")
        created: UnitDto = service.create_unit(_tenant_id(principal), payload, actor)
        logger.info(f"Unit created: id={created.id}, code={created.code}, tenant={created.tenant_id}, by={actor}")
        return success_response(created.model_dump())
    except ValueError as exc:
        logger.error(f"Failed to create unit: {exc}, tenant={_tenant_id(principal)}, by={getattr(principal, 'email', 'system')}")
        raise ApiError(code="VALIDATION_ERROR", message=str(exc), status_code=400)


@router.put("/{unit_id}", response_model=ApiResponse[dict])
def update_unit(
    unit_id: UUID,
    payload: UnitUpdateRequest,
    principal: SecurityPrincipal = Depends(require_permissions(["units.edit"])),
    service: UnitService = Depends(get_service),
):
    try:
        actor = getattr(principal, "email", "system")
        updated = service.update_unit(_tenant_id(principal), unit_id, payload, actor)
        logger.info(f"Unit updated: id={unit_id}, code={updated.code}, tenant={updated.tenant_id}, by={actor}")
        return success_response(updated.model_dump())
    except ValueError as exc:
        message = str(exc)
        raise ApiError(code="VALIDATION_ERROR", message=message, status_code=400)


@router.delete("/{unit_id}", response_model=ApiResponse[dict])
def archive_unit(
    unit_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["units.delete"])),
    service: UnitService = Depends(get_service),
):
    actor = getattr(principal, "email", "system")
    archived = service.archive_unit(_tenant_id(principal), unit_id)
    if not archived:
        logger.warning(f"Attempted to archive non-existent unit: id={unit_id}, tenant={_tenant_id(principal)}, by={actor}")
        raise ResourceNotFoundError("Unit not found")

    logger.info(f"Unit archived: id={unit_id}, tenant={_tenant_id(principal)}, by={actor}")
    return success_response({"id": str(unit_id)})
