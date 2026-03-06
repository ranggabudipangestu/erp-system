from __future__ import annotations

import csv
import io
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from app.common.api_response import success_response, error_response
from app.core.db import session_scope
from app.core.security import require_permissions, SecurityPrincipal

from .models import PaymentTerm
from .repository import PaymentTermRepository
from .service import PaymentTermService
from .schemas import (
    PaymentTermDto,
    CreatePaymentTermDto,
    UpdatePaymentTermDto,
    PaymentTermListResponse,
)

import logging

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_session():
    with session_scope() as session:
        yield session


def get_service(session=Depends(get_session)) -> PaymentTermService:
    repo = PaymentTermRepository(session)
    return PaymentTermService(repo)


def _tenant_id(principal: SecurityPrincipal) -> UUID:
    return principal.tenant_id


@router.get("", response_model=None)
def list_payment_terms(
    search: Optional[str] = Query(None, description="Search term for code, name, or description"),
    include_archived: bool = Query(False, description="Include archived payment terms"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    principal: SecurityPrincipal = Depends(require_permissions(["payment_terms.view"])),
    service: PaymentTermService = Depends(get_service),
):
    payload: PaymentTermListResponse = service.list_payment_terms(
        tenant_id=_tenant_id(principal),
        search=search,
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


@router.get("/export")
def export_payment_terms(
    search: Optional[str] = Query(None, description="Search term for code, name, or description"),
    include_archived: bool = Query(False, description="Include archived payment terms"),
    principal: SecurityPrincipal = Depends(require_permissions(["payment_terms.view"])),
    service: PaymentTermService = Depends(get_service),
):
    try:
        payment_terms = service.export_payment_terms(
            tenant_id=_tenant_id(principal),
            search=search,
            include_archived=include_archived,
        )

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "code",
            "name",
            "description",
            "due_days",
            "early_payment_discount_percent",
            "early_payment_discount_days",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ])

        for payment_term in payment_terms:
            data = payment_term.model_dump()
            writer.writerow([
                data["code"],
                data["name"],
                data.get("description") or "",
                data["due_days"],
                data.get("early_payment_discount_percent") or "",
                data.get("early_payment_discount_days") or "",
                data.get("created_at"),
                data.get("updated_at") or "",
                data["created_by"],
                data.get("updated_by") or "",
            ])

        output.seek(0)
        filename = f"payment_terms_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if "not found" in message.lower() else 400
        code = "NOT_FOUND" if status_code == 404 else "VALIDATION_ERROR"
        return error_response(code, message, status_code=status_code)


@router.get("/{payment_term_id}")
def get_payment_term(
    payment_term_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["payment_terms.view"])),
    service: PaymentTermService = Depends(get_service),
):
    payment_term = service.get_payment_term(_tenant_id(principal), payment_term_id)
    if not payment_term:
        return error_response("NOT_FOUND", "Payment term not found", status_code=404)
    return success_response(payment_term.model_dump())


@router.post("", status_code=201)
def create_payment_term(
    payload: CreatePaymentTermDto,
    principal: SecurityPrincipal = Depends(require_permissions(["payment_terms.create"])),
    service: PaymentTermService = Depends(get_service),
):
    try:
        created: PaymentTermDto = service.create_payment_term(_tenant_id(principal), payload)
        logger.info(f"Payment term created: id={created.id}, code={created.code}, tenant={created.tenant_id}, by={principal.email}")
        return success_response(created.model_dump(), status_code=201)
    except ValueError as exc:
        logger.error(f"Failed to create payment term: {exc}, tenant={_tenant_id(principal)}, by={principal.email}")
        return error_response("VALIDATION_ERROR", str(exc), status_code=400)


@router.put("/{payment_term_id}")
def update_payment_term(
    payment_term_id: UUID,
    payload: UpdatePaymentTermDto,
    principal: SecurityPrincipal = Depends(require_permissions(["payment_terms.edit"])),
    service: PaymentTermService = Depends(get_service),
):
    try:
        updated = service.update_payment_term(_tenant_id(principal), payment_term_id, payload)
        logger.info(f"Payment term updated: id={payment_term_id}, code={updated.code}, tenant={updated.tenant_id}, by={principal.email}")
        return success_response(updated.model_dump())
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if "not found" in message.lower() else 400
        code = "NOT_FOUND" if status_code == 404 else "VALIDATION_ERROR"
        logger.error(f"Failed to update payment term: {message}, id={payment_term_id}, tenant={_tenant_id(principal)}, by={principal.email}")
        return error_response(code, message, status_code=status_code)


@router.delete("/{payment_term_id}")
def archive_payment_term(
    payment_term_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["payment_terms.delete"])),
    service: PaymentTermService = Depends(get_service),
):
    archived = service.archive_payment_term(_tenant_id(principal), payment_term_id)
    if not archived:
        logger.warning(f"Attempted to archive non-existent payment term: id={payment_term_id}, tenant={_tenant_id(principal)}, by={principal.email}")
        return error_response("NOT_FOUND", "Payment term not found", status_code=404)

    logger.info(f"Payment term archived: id={payment_term_id}, tenant={_tenant_id(principal)}, by={principal.email}")
    return success_response({"id": str(payment_term_id)})