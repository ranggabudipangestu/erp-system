from __future__ import annotations

from datetime import datetime
from uuid import UUID, uuid4
from typing import Iterable, Sequence

from .models import Contact, ContactStatus
from .repository import ContactRepository
from .schemas import (
    ContactDto,
    CreateContactDto,
    UpdateContactDto,
    ContactListResponse,
    ContactImportSummary,
)


def _normalize_roles(roles: Sequence[str]) -> list[str]:
    # Ensure deterministic ordering for storage/comparison
    return sorted({role for role in roles})


def _map_to_dto(entity: Contact) -> ContactDto:
    return ContactDto.model_validate(entity, from_attributes=True)


class ContactService:
    def __init__(self, repository: ContactRepository) -> None:
        self.repository = repository

    def list_contacts(
        self,
        tenant_id: UUID,
        *,
        roles: Sequence[str] | None = None,
        status: ContactStatus | None = None,
        search: str | None = None,
    ) -> ContactListResponse:
        entities = self.repository.list(
            tenant_id,
            roles=roles,
            status=status,
            search=search,
        )
        items = [_map_to_dto(entity) for entity in entities]
        return ContactListResponse(items=items, total=len(items))

    def get_contact(self, tenant_id: UUID, contact_id: UUID) -> ContactDto | None:
        entity = self.repository.get_by_id(tenant_id, contact_id)
        return _map_to_dto(entity) if entity else None

    def create_contact(self, tenant_id: UUID, payload: CreateContactDto) -> ContactDto:
        if self.repository.code_exists(tenant_id, payload.code):
            raise ValueError(f"Contact with code '{payload.code}' already exists")

        contact = Contact(
            id=uuid4(),
            tenant_id=tenant_id,
            code=payload.code,
            name=payload.name,
            email=payload.email,
            phone=payload.phone,
            address_billing=payload.address_billing,
            address_shipping=payload.address_shipping,
            tax_number=payload.tax_number,
            roles=_normalize_roles(payload.roles),
            status=payload.status,
            credit_limit=payload.credit_limit,
            distribution_channel=payload.distribution_channel,
            pic_name=payload.pic_name,
            bank_account_number=payload.bank_account_number,
            payment_terms=payload.payment_terms,
            sales_contact_name=payload.sales_contact_name,
            employee_id=payload.employee_id,
            department=payload.department,
            job_title=payload.job_title,
            employment_status=payload.employment_status,
            created_by=payload.created_by,
        )

        created = self.repository.create(contact)
        return _map_to_dto(created)

    def update_contact(self, tenant_id: UUID, contact_id: UUID, payload: UpdateContactDto) -> ContactDto:
        entity = self.repository.get_by_id(tenant_id, contact_id)
        if not entity:
            raise ValueError("Contact not found")

        if payload.code != entity.code and self.repository.code_exists(tenant_id, payload.code):
            raise ValueError(f"Contact with code '{payload.code}' already exists")

        entity.code = payload.code
        entity.name = payload.name
        entity.email = payload.email
        entity.phone = payload.phone
        entity.address_billing = payload.address_billing
        entity.address_shipping = payload.address_shipping
        entity.tax_number = payload.tax_number
        entity.roles = _normalize_roles(payload.roles)
        entity.status = payload.status
        entity.credit_limit = payload.credit_limit
        entity.distribution_channel = payload.distribution_channel
        entity.pic_name = payload.pic_name
        entity.bank_account_number = payload.bank_account_number
        entity.payment_terms = payload.payment_terms
        entity.sales_contact_name = payload.sales_contact_name
        entity.employee_id = payload.employee_id
        entity.department = payload.department
        entity.job_title = payload.job_title
        entity.employment_status = payload.employment_status
        entity.updated_by = payload.updated_by
        entity.updated_at = datetime.utcnow()
        if entity.status == ContactStatus.ARCHIVED and not entity.archived_at:
            entity.archived_at = datetime.utcnow()
        elif entity.status == ContactStatus.ACTIVE:
            entity.archived_at = None

        updated = self.repository.update(entity)
        return _map_to_dto(updated)

    def archive_contact(self, tenant_id: UUID, contact_id: UUID) -> bool:
        return self.repository.archive(tenant_id, contact_id)

    def import_contacts(
        self,
        tenant_id: UUID,
        *,
        contacts: Iterable[Contact],
    ) -> ContactImportSummary:
        created, updated = self.repository.bulk_upsert(tenant_id, contacts)
        return ContactImportSummary(created=created, updated=updated, skipped=0)

    def export_contacts(
        self,
        tenant_id: UUID,
        *,
        roles: Sequence[str] | None = None,
        status: ContactStatus | None = None,
        search: str | None = None,
    ) -> list[ContactDto]:
        entities = self.repository.list(tenant_id, roles=roles, status=status, search=search)
        return [_map_to_dto(entity) for entity in entities]
