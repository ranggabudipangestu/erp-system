"""Seed default tenant roles

Revision ID: seed_default_roles
Revises: permission_seed_001
Create Date: 2024-09-14 12:00:00.000000

"""
from __future__ import annotations

from datetime import datetime, timezone
import uuid
import sys
from pathlib import Path
from typing import List, Dict

import sqlalchemy as sa
from alembic import op

VERSIONS_DIR = Path(__file__).resolve().parent
if str(VERSIONS_DIR) not in sys.path:
    sys.path.append(str(VERSIONS_DIR))

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from app.modules.permissions.menu_definitions import (  # noqa: E402
    ALL_MENU_PERMISSION_KEYS,
    MENU_STRUCTURE,
)

# revision identifiers, used by Alembic.
revision = "seed_default_roles"
down_revision = "permission_seed_001"
branch_labels = None
depends_on = None


MENU_VIEW_PERMISSIONS = {item["permission_key"] for items in MENU_STRUCTURE.values() for item in items}

BASE_ADMIN_PERMISSIONS = set(MENU_VIEW_PERMISSIONS).union({
    # Tenant & user management
    "tenant.manage_settings",
    "users.invite_user",
    "users.deactivate_user",
    "users.create",
    "users.update",
    "users.delete",
    "roles.create_role",
    "roles.update",
    "roles.delete",

    # Master data maintenance
    "products.view",
    "products.create",
    "products.update",
    "products.delete",
    "product_categories.view",
    "product_categories.create",
    "product_categories.update",
    "product_categories.delete",
    "contacts.view",
    "contacts.create",
    "contacts.update",
    "contacts.delete",
    "chart_of_accounts.view",
    "chart_of_accounts.create",
    "chart_of_accounts.update",
    "chart_of_accounts.delete",
    "locations.view",
    "locations.create",
    "locations.update",
    "locations.delete",
    "currencies.view",
    "currencies.create",
    "currencies.update",
    "currencies.delete",
    "units.view",
    "units.create",
    "units.update",
    "units.delete",
    "payment_terms.view",
    "payment_terms.create",
    "payment_terms.update",
    "payment_terms.delete",
    "taxes.view",
    "taxes.create",
    "taxes.update",
    "taxes.delete",

    # Finance operations
    "finance.cash_bank_in.view",
    "finance.cash_bank_in.create",
    "finance.cash_bank_out.view",
    "finance.cash_bank_out.create",
    "finance.ap_payments.view",
    "finance.ap_payments.create",
    "finance.ar_payments.view",
    "finance.ar_payments.create",
    "finance.journal.view",
    "finance.journal.create",
    "finance.post_journal",

    # Purchasing
    "purchasing.purchase_requests.view",
    "purchasing.purchase_requests.create",
    "purchasing.rfq.view",
    "purchasing.rfq.create",
    "purchasing.purchase_orders.view",
    "purchasing.purchase_orders.create",
    "purchasing.goods_receipts.view",
    "purchasing.goods_receipts.create",
    "purchasing.receive_invoices.view",
    "purchasing.receive_invoices.create",
    "purchasing.purchase_returns.view",
    "purchasing.purchase_returns.create",
    "purchasing.tukar_faktur.view",
    "purchasing.tukar_faktur.create",

    # Sales
    "sales.quotations.view",
    "sales.create_order",
    "sales.quotations.create",
    "sales.invoices.view",
    "sales.invoices.create",
    "sales.returns.view",
    "sales.returns.create",
    "sales.orders.view",
    "sales.sync_marketplace",
    "sales.pos.view",

    # Inventory
    "inventory.product_mutations.view",
    "inventory.stock_in_out",
    "inventory.transfer_stock",
    "inventory.product_mutations.create",
    "inventory.stock_opname.view",
    "inventory.stock_opname.create",
    "inventory.stock_adjustments.view",
    "inventory.stock_adjustments.create",

    # Manufacturing
    "manufacturing.bom.view",
    "manufacturing.create_bom",
    "manufacturing.create_wo",
    "manufacturing.production_orders.view",
    "manufacturing.production_orders.create",
    "manufacturing.work_centers.view",
    "manufacturing.work_centers.update",
})

FULL_ADMIN_PERMISSIONS = sorted(set(ALL_MENU_PERMISSION_KEYS).union(BASE_ADMIN_PERMISSIONS))

ROLE_DEFINITIONS: List[Dict[str, object]] = [
    {
        "name": "owner",
        "description": "Tenant owner with full access",
        "permissions": FULL_ADMIN_PERMISSIONS,
    },
    {
        "name": "admin",
        "description": "Tenant administrator with full menu access",
        "permissions": FULL_ADMIN_PERMISSIONS,
    },
]

ROLE_NAMES = tuple(defn["name"] for defn in ROLE_DEFINITIONS)


def _upsert_role(connection: sa.engine.Connection, tenant_id: uuid.UUID, role_def: Dict[str, object]) -> None:
    existing_id = connection.execute(
        sa.text(
            "SELECT id FROM roles WHERE tenant_id = :tenant_id AND name = :name"
        ),
        {"tenant_id": tenant_id, "name": role_def["name"]},
    ).scalar()

    params = {
        "tenant_id": tenant_id,
        "name": role_def["name"],
        "description": role_def.get("description"),
        "permissions": sa.text("to_jsonb(:perm_array)") if role_def["permissions"] else sa.text("'[]'::jsonb"),
        "perm_array": role_def["permissions"],
    }

    if existing_id:
        connection.execute(
            sa.text(
                """
                UPDATE roles
                SET description = :description,
                    permissions = to_jsonb(:perm_array),
                    is_system_role = false,
                    updated_at = :updated_at
                WHERE id = :role_id
                """
            ),
            {
                "tenant_id": tenant_id,
                "name": role_def["name"],
                "description": role_def.get("description"),
                "perm_array": role_def["permissions"],
                "role_id": existing_id,
                "updated_at": datetime.now(timezone.utc),
            },
        )
    else:
        connection.execute(
            sa.text(
                """
                INSERT INTO roles (id, tenant_id, name, description, permissions, is_system_role, created_at)
                VALUES (:id, :tenant_id, :name, :description, to_jsonb(:perm_array), false, :created_at)
                """
            ),
            {
                "tenant_id": tenant_id,
                "name": role_def["name"],
                "description": role_def.get("description"),
                "perm_array": role_def["permissions"],
                "id": str(uuid.uuid4()),
                "created_at": datetime.now(timezone.utc),
            },
        )


def upgrade() -> None:
    connection = op.get_bind()

    tenant_rows = connection.execute(sa.text("SELECT id FROM tenants")).fetchall()
    tenant_ids = [row[0] for row in tenant_rows]

    if not tenant_ids:
        return

    for tenant_id in tenant_ids:
        for role_def in ROLE_DEFINITIONS:
            _upsert_role(connection, tenant_id, role_def)


def downgrade() -> None:
    connection = op.get_bind()
    connection.execute(
        sa.text(
            "DELETE FROM roles WHERE name = ANY(:role_names)"
        ),
        {"role_names": list(ROLE_NAMES)},
    )
