from __future__ import annotations

from typing import Iterable, Sequence
from uuid import UUID

from sqlalchemy import select, or_, func, update as sa_update
from sqlalchemy.orm import Session

from .models import Contact


class ContactRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def _base_query(self, tenant_id: UUID):
        return select(Contact).where(Contact.tenant_id == tenant_id)

    def _filtered_query(
        self,
        tenant_id: UUID,
        *,
        roles: Sequence[str] | None = None,
        search: str | None = None,
    ):
        stmt = self._base_query(tenant_id)

        stmt = stmt.where(Contact.deleted_at.is_(None))

        if roles:
            for role in roles:
                stmt = stmt.where(Contact.roles.contains([role]))

        if search:
            term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Contact.name.ilike(term),
                    Contact.code.ilike(term),
                    func.coalesce(Contact.email, "").ilike(term),
                    func.coalesce(Contact.phone, "").ilike(term),
                )
            )

        return stmt

    def list(
        self,
        tenant_id: UUID,
        *,
        roles: Sequence[str] | None = None,
        search: str | None = None,
        limit: int | None = None,
        offset: int | None = None,
    ) -> tuple[list[Contact], int]:
        filtered = self._filtered_query(
            tenant_id,
            roles=roles,
            search=search,
        )

        count_stmt = filtered.with_only_columns(func.count()).order_by(None)
        total = self.session.execute(count_stmt).scalar_one()

        data_stmt = filtered.order_by(Contact.name.asc())
        if limit is not None:
            data_stmt = data_stmt.limit(limit)
        if offset:
            data_stmt = data_stmt.offset(offset)

        result = self.session.execute(data_stmt).scalars().all()
        return list(result), total

    def get_by_id(self, tenant_id: UUID, contact_id: UUID) -> Contact | None:
        stmt = self._base_query(tenant_id).where(Contact.id == contact_id)
        return self.session.execute(stmt).scalar_one_or_none()

    def get_by_code(self, tenant_id: UUID, code: str) -> Contact | None:
        stmt = self._base_query(tenant_id).where(Contact.code == code)
        return self.session.execute(stmt).scalar_one_or_none()

    def code_exists(self, tenant_id: UUID, code: str, *, exclude_id: UUID | None = None) -> bool:
        stmt = self._base_query(tenant_id).where(Contact.code == code)
        if exclude_id:
            stmt = stmt.where(Contact.id != exclude_id)
        return self.session.execute(stmt).scalar_one_or_none() is not None

    def create(self, contact: Contact) -> Contact:
        self.session.add(contact)
        self.session.flush()
        return contact

    def update(self, contact: Contact) -> Contact:
        self.session.flush()
        return contact

    def archive(self, tenant_id: UUID, contact_id: UUID) -> bool:
        self.session.execute(
            sa_update(Contact)
            .where(Contact.tenant_id == tenant_id, Contact.id == contact_id, Contact.deleted_at.is_(None))
            .values(deleted_at=func.now())
        )
        return True

    def bulk_upsert(self, tenant_id: UUID, contacts: Iterable[Contact]) -> tuple[int, int]:
        created = 0
        updated = 0

        for contact in contacts:
            existing = self.get_by_code(tenant_id, contact.code)
            if existing:
                # Update fields
                for attr in (
                    "name",
                    "email",
                    "phone",
                    "address_billing",
                    "address_shipping",
                    "tax_number",
                    "roles",
                    "status",
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
                    "updated_by",
                    "updated_at",
                ):
                    setattr(existing, attr, getattr(contact, attr))
                existing.archived_at = contact.archived_at
                updated += 1
            else:
                self.session.add(contact)
                created += 1

        self.session.flush()
        return created, updated
