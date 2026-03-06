from __future__ import annotations

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.core.response import success_response, ApiResponse
from app.core.exceptions import ApiError, ResourceNotFoundError
from app.core.db import session_scope
from app.core.security import require_permissions, SecurityPrincipal

from .repository import ChartOfAccountRepository
from .service import ChartOfAccountService
from .schemas import (
    ChartOfAccountDto,
    ChartOfAccountTreeDto,
    ChartOfAccountListResponse,
    CreateChartOfAccountDto,
    UpdateChartOfAccountDto,
)

import logging

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_session():
    with session_scope() as session:
        yield session


def get_service(session=Depends(get_session)) -> ChartOfAccountService:
    repo = ChartOfAccountRepository(session)
    return ChartOfAccountService(repo)


def _tenant_id(principal: SecurityPrincipal) -> UUID:
    return principal.tenant_id


@router.get("", response_model=ApiResponse[List[dict]])
def list_accounts(
    search: Optional[str] = Query(None),
    account_type: Optional[str] = Query(None, description="Filter by type: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE"),
    include_archived: bool = Query(False),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    principal: SecurityPrincipal = Depends(require_permissions(["chart_of_accounts.view"])),
    service: ChartOfAccountService = Depends(get_service),
):
    payload: ChartOfAccountListResponse = service.list_accounts(
        tenant_id=_tenant_id(principal),
        search=search,
        account_type=account_type,
        include_archived=include_archived,
        page=page,
        page_size=page_size,
    )
    return success_response(
        [item.model_dump() for item in payload.items],
        metadata={
            "total": payload.total,
            "page": payload.page,
            "pageSize": payload.page_size,
            "totalPages": payload.total_pages,
            "hasNext": payload.page < payload.total_pages,
            "hasPrev": payload.page > 1,
        },
    )


@router.get("/tree", response_model=ApiResponse[List[dict]])
def get_tree(
    principal: SecurityPrincipal = Depends(require_permissions(["chart_of_accounts.view"])),
    service: ChartOfAccountService = Depends(get_service),
):
    tree: List[ChartOfAccountTreeDto] = service.get_tree(_tenant_id(principal))
    return success_response([item.model_dump() for item in tree])


@router.get("/{account_id}", response_model=ApiResponse[dict])
def get_account(
    account_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["chart_of_accounts.view"])),
    service: ChartOfAccountService = Depends(get_service),
):
    account = service.get_account(_tenant_id(principal), account_id)
    if not account:
        raise ResourceNotFoundError("Account not found")
    return success_response(account.model_dump())


@router.post("", status_code=201, response_model=ApiResponse[dict])
def create_account(
    payload: CreateChartOfAccountDto,
    principal: SecurityPrincipal = Depends(require_permissions(["chart_of_accounts.create"])),
    service: ChartOfAccountService = Depends(get_service),
):
    try:
        created: ChartOfAccountDto = service.create_account(_tenant_id(principal), payload)
        logger.info(f"CoA created: id={created.id}, code={created.code}, tenant={created.tenant_id}, by={principal.email}")
        return success_response(created.model_dump())
    except ValueError as exc:
        logger.error(f"Failed to create CoA: {exc}, tenant={_tenant_id(principal)}, by={principal.email}")
        raise ApiError(code="VALIDATION_ERROR", message=str(exc), status_code=400)


@router.put("/{account_id}", response_model=ApiResponse[dict])
def update_account(
    account_id: UUID,
    payload: UpdateChartOfAccountDto,
    principal: SecurityPrincipal = Depends(require_permissions(["chart_of_accounts.edit"])),
    service: ChartOfAccountService = Depends(get_service),
):
    try:
        updated = service.update_account(_tenant_id(principal), account_id, payload)
        logger.info(f"CoA updated: id={account_id}, code={updated.code}, tenant={updated.tenant_id}, by={principal.email}")
        return success_response(updated.model_dump())
    except ValueError as exc:
        status_code = 404 if "not found" in message.lower() else 400
        logger.error(f"Failed to update CoA: {message}, id={account_id}, tenant={_tenant_id(principal)}, by={principal.email}")
        if status_code == 404:
            raise ResourceNotFoundError(message)
        raise ApiError(code="VALIDATION_ERROR", message=message, status_code=400)


@router.delete("/{account_id}", response_model=ApiResponse[dict])
def archive_account(
    account_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["chart_of_accounts.delete"])),
    service: ChartOfAccountService = Depends(get_service),
):
    try:
        archived = service.archive_account(_tenant_id(principal), account_id)
        if not archived:
            logger.warning(f"Attempted to archive non-existent CoA: id={account_id}, tenant={_tenant_id(principal)}, by={principal.email}")
            raise ResourceNotFoundError("Account not found")
        logger.info(f"CoA archived: id={account_id}, tenant={_tenant_id(principal)}, by={principal.email}")
        return success_response({"id": str(account_id)})
    except ValueError as exc:
        message = str(exc)
        logger.error(f"Failed to archive CoA: {message}, id={account_id}, tenant={_tenant_id(principal)}, by={principal.email}")
        raise ApiError(code="VALIDATION_ERROR", message=message, status_code=400)
