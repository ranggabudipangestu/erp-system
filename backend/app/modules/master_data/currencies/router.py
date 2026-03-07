from __future__ import annotations

import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.response import success_response, ApiResponse
from app.core.exceptions import ApiError, ResourceNotFoundError
from app.core.db import session_scope
from app.core.security import require_permissions, SecurityPrincipal

from .repository import CurrencyRepository
from .service import CurrencyService
from .schemas import (
    CurrencyDto,
    CurrencyCreateRequest,
    CurrencyUpdateRequest,
    CurrencyListResponse,
)


router = APIRouter()
logger = logging.getLogger(__name__)


def get_session():
    with session_scope() as session:
        yield session


def get_service(session=Depends(get_session)) -> CurrencyService:
    repo = CurrencyRepository(session)
    return CurrencyService(repo)


def _tenant_id(principal: SecurityPrincipal) -> UUID:
    return principal.tenant_id


@router.get("", response_model=ApiResponse[List[dict]])
def list_currencies(
    search: Optional[str] = Query(None, description="Search term for code or name"),
    include_archived: bool = Query(False, description="Include archived currencies"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    principal: SecurityPrincipal = Depends(require_permissions(["currencies.view"])),
    service: CurrencyService = Depends(get_service),
):
    items, total = service.list_currencies(
        tenant_id=_tenant_id(principal),
        search=search,
        include_archived=include_archived,
        page=page,
        page_size=page_size,
    )
    
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    
    return success_response(
        result=[CurrencyDto.model_validate(c).model_dump(mode="json") for c in items],
        metadata={
            "total": total,
            "page": page,
            "pageSize": page_size,
            "totalPages": total_pages,
            "hasNext": page < total_pages,
            "hasPrev": page > 1,
        },
    )


@router.get("/{currency_id}", response_model=ApiResponse[dict])
def get_currency(
    currency_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["currencies.view"])),
    service: CurrencyService = Depends(get_service),
):
    currency = service.get_currency(
        tenant_id=_tenant_id(principal),
        currency_id=currency_id,
    )
    
    return success_response(
        result=CurrencyDto.model_validate(currency).model_dump(mode="json")
    )


@router.post("", response_model=ApiResponse[dict], status_code=201)
def create_currency(
    request: CurrencyCreateRequest,
    principal: SecurityPrincipal = Depends(require_permissions(["currencies.create"])),
    service: CurrencyService = Depends(get_service),
):
    try:
        currency = service.create_currency(
            tenant_id=_tenant_id(principal),
            user_id=principal.user_id,
            request=request,
        )
        return success_response(
            result=CurrencyDto.model_validate(currency).model_dump(mode="json")
        )
    except Exception as exc:
        logger.error("Failed to create currency", exc_info=exc)
        raise ApiError(code="VALIDATION_ERROR", message=str(exc), status_code=400) from exc


@router.put("/{currency_id}", response_model=ApiResponse[dict])
def update_currency(
    currency_id: UUID,
    request: CurrencyUpdateRequest,
    principal: SecurityPrincipal = Depends(require_permissions(["currencies.update"])),
    service: CurrencyService = Depends(get_service),
):
    try:
        currency = service.update_currency(
            tenant_id=_tenant_id(principal),
            currency_id=currency_id,
            user_id=principal.user_id,
            request=request,
        )
        return success_response(
            result=CurrencyDto.model_validate(currency).model_dump(mode="json")
        )
    except ResourceNotFoundError:
        raise
    except Exception as exc:
        logger.error("Failed to update currency", exc_info=exc)
        message = str(exc) if str(exc) else "An unexpected error occurred."
        raise ApiError(code="VALIDATION_ERROR", message=message, status_code=400) from exc


@router.delete("/{currency_id}", response_model=ApiResponse[dict])
def archive_currency(
    currency_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["currencies.delete"])),
    service: CurrencyService = Depends(get_service),
):
    try:
        currency = service.archive_currency(
            tenant_id=_tenant_id(principal),
            currency_id=currency_id,
        )
        return success_response(
            result=CurrencyDto.model_validate(currency).model_dump(mode="json")
        )
    except ResourceNotFoundError:
        raise
    except Exception as exc:
        logger.error("Failed to archive currency", exc_info=exc)
        raise ApiError(code="INTERNAL_ERROR", message=str(exc), status_code=500) from exc
