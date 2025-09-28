from __future__ import annotations

import csv
import io
from datetime import datetime
from decimal import Decimal, InvalidOperation
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, UploadFile, Query
from fastapi.responses import StreamingResponse

from app.common.api_response import success_response, error_response
from app.core.db import session_scope
from app.core.security import require_permissions, SecurityPrincipal

from .models import Contact
from .repository import ContactRepository
from .service import ContactService, _normalize_roles
from .schemas import ContactDto, CreateContactDto, UpdateContactDto, ContactListResponse, ContactImportSummary
import logging

router = APIRouter()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_session():
    with session_scope() as session:
        yield session


def get_service(session=Depends(get_session)) -> ContactService:
    repo = ContactRepository(session)
    return ContactService(repo)


def _tenant_id(principal: SecurityPrincipal) -> UUID:
    return principal.tenant_id


@router.get("", response_model=None)
def list_contacts(
    search: Optional[str] = Query(None, description="Search term for code, name, email, or phone"),
    roles: Optional[List[str]] = Query(None, description="Filter by one or more roles"),
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    principal: SecurityPrincipal = Depends(require_permissions(["contacts.view"])),
    service: ContactService = Depends(get_service),
):
    payload: ContactListResponse = service.list_contacts(
        tenant_id=_tenant_id(principal),
        roles=roles,
        search=search,
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
def export_contacts(
    search: Optional[str] = Query(None),
    roles: Optional[List[str]] = Query(None),
    principal: SecurityPrincipal = Depends(require_permissions(["contacts.view"])),
    service: ContactService = Depends(get_service),
):
    try:
        contacts = service.export_contacts(
            tenant_id=_tenant_id(principal),
            roles=roles,
            search=search,
        )

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "code",
            "name",
            "email",
            "phone",
            "address_billing",
            "address_shipping",
            "tax_number",
            "roles",
            "credit_limit",
            "distribution_channel",
            "pic_name",
            "bank_account_number",
            "payment_terms",
            "sales_contact_name",
            "employee_id",
            "department",
            "job_title",
            "employment_status",
            "created_at",
            "updated_at",
        ])

        for contact in contacts:
            data = contact.model_dump()
            writer.writerow([
                data["code"],
                data["name"],
                data.get("email") or "",
                data.get("phone") or "",
                data.get("address_billing") or "",
                data.get("address_shipping") or "",
                data.get("tax_number") or "",
                "|".join(data.get("roles", [])),
                data.get("credit_limit") or "",
                data.get("distribution_channel") or "",
                data.get("pic_name") or "",
                data.get("bank_account_number") or "",
                data.get("payment_terms") or "",
                data.get("sales_contact_name") or "",
                data.get("employee_id") or "",
                data.get("department") or "",
                data.get("job_title") or "",
                data.get("employment_status") or "",
                data.get("created_at"),
                data.get("updated_at") or "",
            ])

        output.seek(0)
        filename = f"contacts_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        headers = {"Content-Disposition": f"attachment; filename={filename}"}
        return StreamingResponse(iter([output.getvalue()]), media_type="text/csv", headers=headers)
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if "not found" in message.lower() else 400
        code = "NOT_FOUND" if status_code == 404 else "VALIDATION_ERROR"
        return error_response(code, message, status_code=status_code)
    

@router.get("/{contact_id}")
def get_contact(
    contact_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["contacts.view"])),
    service: ContactService = Depends(get_service),
):
    contact = service.get_contact(_tenant_id(principal), contact_id)
    if not contact:
        return error_response("NOT_FOUND", "Contact not found", status_code=404)
    return success_response(contact.model_dump())


@router.post("", status_code=201)
def create_contact(
    payload: CreateContactDto,
    principal: SecurityPrincipal = Depends(require_permissions(["contacts.create"])),
    service: ContactService = Depends(get_service),
):
    try:
        created: ContactDto = service.create_contact(_tenant_id(principal), payload)
        return success_response(created.model_dump(), status_code=201)
    except ValueError as exc:
        return error_response("VALIDATION_ERROR", str(exc), status_code=400)


@router.put("/{contact_id}")
def update_contact(
    contact_id: UUID,
    payload: UpdateContactDto,
    principal: SecurityPrincipal = Depends(require_permissions(["contacts.edit"])),
    service: ContactService = Depends(get_service),
):
    try:
        updated = service.update_contact(_tenant_id(principal), contact_id, payload)
        return success_response(updated.model_dump())
    except ValueError as exc:
        message = str(exc)
        status_code = 404 if "not found" in message.lower() else 400
        code = "NOT_FOUND" if status_code == 404 else "VALIDATION_ERROR"
        return error_response(code, message, status_code=status_code)


@router.delete("/{contact_id}")
def archive_contact(
    contact_id: UUID,
    principal: SecurityPrincipal = Depends(require_permissions(["contacts.delete"])),
    service: ContactService = Depends(get_service),
):
    archived = service.archive_contact(_tenant_id(principal), contact_id)
    if not archived:
        return error_response("NOT_FOUND", "Contact not found", status_code=404)
    return success_response({"id": str(contact_id)})


def _parse_decimal(value: str | None) -> Decimal | None:
    if value is None or value == "":
        return None
    try:
        return Decimal(value)
    except InvalidOperation as exc:
        raise ValueError(f"Invalid decimal value '{value}'") from exc


def _parse_roles(raw_roles: str | None) -> list[str]:
    if not raw_roles:
        return []
    separators = [",", "|", ";"]
    temp = [raw_roles]
    for sep in separators:
        temp = [segment for value in temp for segment in value.split(sep)]
    parts = [role.strip().title() for role in temp if role.strip()]
    return _normalize_roles(parts)


def _contact_from_row(
    row: dict[str, str],
    *,
    tenant_id: UUID,
    actor: str,
) -> Contact:
    roles = _parse_roles(row.get("roles"))
    if not roles:
        raise ValueError("At least one role is required (column 'roles')")

   
    contact = Contact(
        id=uuid4(),
        tenant_id=tenant_id,
        code=(row.get("code") or "").strip(),
        name=(row.get("name") or "").strip(),
        email=(row.get("email") or "").strip() or None,
        phone=(row.get("phone") or "").strip() or None,
        address_billing=row.get("address_billing") or None,
        address_shipping=row.get("address_shipping") or None,
        tax_number=(row.get("tax_number") or "").strip() or None,
        roles=roles,
        credit_limit=_parse_decimal(row.get("credit_limit")),
        distribution_channel=row.get("distribution_channel") or None,
        pic_name=row.get("pic_name") or None,
        bank_account_number=row.get("bank_account_number") or None,
        payment_terms=row.get("payment_terms") or None,
        sales_contact_name=row.get("sales_contact_name") or None,
        employee_id=row.get("employee_id") or None,
        department=row.get("department") or None,
        job_title=row.get("job_title") or None,
        employment_status=row.get("employment_status") or None,
        created_by=actor,
        updated_by=actor,
        updated_at=datetime.utcnow(),
    )

    if not contact.code:
        raise ValueError("Column 'code' is required")
    if not contact.name:
        raise ValueError("Column 'name' is required")

    return contact


@router.post("/import")
async def import_contacts(
    file: UploadFile,
    principal: SecurityPrincipal = Depends(require_permissions(["contacts.create", "contacts.edit"])),
    service: ContactService = Depends(get_service),
):
    if file.content_type not in {"text/csv", "application/vnd.ms-excel", "application/csv"}:
        return error_response(
            "UNSUPPORTED_MEDIA_TYPE",
            "Currently only CSV imports are supported",
            status_code=415,
        )

    content = await file.read()
    try:
        text = content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return error_response("INVALID_FILE", "Unable to decode file; please upload UTF-8 CSV", status_code=400)

    reader = csv.DictReader(io.StringIO(text))
    parsed_contacts: list[Contact] = []
    errors: list[str] = []

    for index, row in enumerate(reader, start=2):  # accounting for header line
        try:
            contact = _contact_from_row(row, tenant_id=_tenant_id(principal), actor=principal.email or "system")
            parsed_contacts.append(contact)
        except ValueError as exc:
            errors.append(f"Row {index}: {exc}")

    summary = ContactImportSummary(created=0, updated=0, skipped=len(errors), errors=errors)

    if parsed_contacts:
        repo_summary = service.import_contacts(_tenant_id(principal), contacts=parsed_contacts)
        summary.created = repo_summary.created
        summary.updated = repo_summary.updated

    return success_response(
        summary.model_dump(),
        metadata={
            "created": summary.created,
            "updated": summary.updated,
            "skipped": summary.skipped,
            "errors": len(summary.errors),
        },
    )
    
