from __future__ import annotations

import logging
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.response import success_response, ApiResponse
from app.core.exceptions import ApiError, ResourceNotFoundError
from app.core.db import session_scope
from app.core.security import require_permissions, SecurityPrincipal

from .repository import ProductCategoryRepository
from .service import ProductCategoryService
from .schemas import (
    ProductCategoryDto,
    ProductCategoryCreateRequest,
    ProductCategoryUpdateRequest,
    ProductCategoryListResponse,
)

router = APIRouter()

logger = logging.getLogger(__name__)


def get_session():
    with session_scope() as session:
        yield session


def get_service(session=Depends(get_session)) -> ProductCategoryService:
    repo = ProductCategoryRepository(session)
    return ProductCategoryService(repo)


def _tenant_id(principal: SecurityPrincipal) -> UUID:
    return principal.tenant_id


@router.get("", response_model=ApiResponse)
def list_categories(
    search: Optional[str] = Query(None, description="Search term for code or name"),
    parent_id: Optional[UUID] = Query(None, description="Filter by parent category"),
    include_archived: bool = Query(False, description="Include archived categories"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    principal: SecurityPrincipal = Depends(require_permissions(["product_categories.view"])),
    service: ProductCategoryService = Depends(get_service),
):
    payload: ProductCategoryListResponse = service.list_categories(
        tenant_id=_tenant_id(principal),
        search=search,
        parent_id=parent_id,
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


@router.get("/tree", response_model=ApiResponse)
def get_tree(
    principal: SecurityPrincipal = Depends(require_permissions(["product_categories.view"])),
    service: ProductCategoryService = Depends(get_service),
):
    tree = service.get_tree(_tenant_id(principal))
    return success_response([node.model_dump() for node in tree])


@router.get("/{category_id}", response_model=ApiResponse)
def get_category(
    category_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["product_categories.view"])),
    service: ProductCategoryService = Depends(get_service),
):
    category = service.get_category(_tenant_id(principal), category_id)
    if not category:
        raise ResourceNotFoundError("Product category not found")
    return success_response(category.model_dump())


@router.post("", status_code=201, response_model=ApiResponse)
def create_category(
    payload: ProductCategoryCreateRequest,
    principal: SecurityPrincipal = Depends(require_permissions(["product_categories.create"])),
    service: ProductCategoryService = Depends(get_service),
):
    try:
        actor = getattr(principal, "email", "system")
        created = service.create_category(_tenant_id(principal), payload, actor)
        logger.info(
            "Product category created: id=%s, code=%s, tenant=%s, by=%s",
            created.id, created.code, created.tenant_id, actor,
        )
        return success_response(created.model_dump())
    except ValueError as exc:
        logger.error(
            "Failed to create product category: %s, tenant=%s",
            exc, _tenant_id(principal),
        )
        raise ApiError(code="VALIDATION_ERROR", message=str(exc), status_code=400) from exc


@router.put("/{category_id}", response_model=ApiResponse)
def update_category(
    category_id: UUID,
    payload: ProductCategoryUpdateRequest,
    principal: SecurityPrincipal = Depends(require_permissions(["product_categories.edit"])),
    service: ProductCategoryService = Depends(get_service),
):
    try:
        actor = getattr(principal, "email", "system")
        updated = service.update_category(_tenant_id(principal), category_id, payload, actor)
        logger.info(
            "Product category updated: id=%s, code=%s, tenant=%s, by=%s",
            category_id, updated.code, updated.tenant_id, actor,
        )
        return success_response(updated.model_dump())
    except ValueError as exc:
        raise ApiError(code="VALIDATION_ERROR", message=str(exc), status_code=400) from exc


@router.delete("/{category_id}", response_model=ApiResponse)
def archive_category(
    category_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["product_categories.delete"])),
    service: ProductCategoryService = Depends(get_service),
):
    actor = getattr(principal, "email", "system")
    archived = service.archive_category(_tenant_id(principal), category_id)
    if not archived:
        logger.warning(
            "Attempted to archive non-existent product category: id=%s, tenant=%s, by=%s",
            category_id, _tenant_id(principal), actor,
        )
        raise ResourceNotFoundError("Product category not found")

    logger.info(
        "Product category archived: id=%s, tenant=%s, by=%s",
        category_id, _tenant_id(principal), actor,
    )
    return success_response({"id": str(category_id)})
