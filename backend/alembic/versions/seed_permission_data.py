"""Seed permission management data

Revision ID: permission_seed_001
Revises: 3e2a1a4c9abc
Create Date: 2024-09-13 10:01:00.000000

"""
from alembic import op
import sqlalchemy as sa
import uuid
import sys
from pathlib import Path

VERSIONS_DIR = Path(__file__).resolve().parent
if str(VERSIONS_DIR) not in sys.path:
    sys.path.append(str(VERSIONS_DIR))

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.append(str(BACKEND_ROOT))

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

import add_permission_management_tables  # type: ignore
from app.modules.permissions.menu_definitions import MENU_STRUCTURE

# revision identifiers, used by Alembic.
revision = 'permission_seed_001'
down_revision = '3e2a1a4c9abc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Get metadata and tables
    connection = op.get_bind()
    inspector = sa.inspect(connection)

    required_tables = {
        'subscription_plans',
        'modules',
        'menu_items',
        'plan_menu_items',
        'role_permissions',
        'tenants',
    }
    missing_tables = required_tables.difference(inspector.get_table_names())

    if missing_tables:
        add_permission_management_tables.upgrade()
        inspector = sa.inspect(connection)
        missing_tables = required_tables.difference(inspector.get_table_names())
        if missing_tables:
            raise RuntimeError(
                "Missing permission tables after attempting to create them: "
                + ", ".join(sorted(missing_tables))
            )
    
    # Insert subscription plans
    plans_data = [
        {
            'id': str(uuid.uuid4()),
            'code': 'basic',
            'name': 'Basic Plan',
            'description': 'Essential features for small businesses',
            'price_monthly': 29.00,
            'price_yearly': 290.00,
            'sort_order': 1
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'professional', 
            'name': 'Professional Plan',
            'description': 'Advanced features for growing businesses',
            'price_monthly': 79.00,
            'price_yearly': 790.00,
            'sort_order': 2
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'enterprise',
            'name': 'Enterprise Plan', 
            'description': 'Full features for large organizations',
            'price_monthly': 199.00,
            'price_yearly': 1990.00,
            'sort_order': 3
        }
    ]
    
    plan_id_map = {}
    for plan in plans_data:
        result = connection.execute(
            sa.text("""
                INSERT INTO subscription_plans (id, code, name, description, price_monthly, price_yearly, sort_order, is_active, created_at)
                VALUES (:id, :code, :name, :description, :price_monthly, :price_yearly, :sort_order, true, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price_monthly = EXCLUDED.price_monthly,
                    price_yearly = EXCLUDED.price_yearly,
                    sort_order = EXCLUDED.sort_order,
                    is_active = true
                RETURNING id
            """),
            plan
        )
        inserted_id = result.scalar()
        if inserted_id is None:
            inserted_id = connection.execute(
                sa.text("SELECT id FROM subscription_plans WHERE code = :code"),
                {"code": plan["code"]}
            ).scalar()
        plan_id_map[plan['code']] = inserted_id
    
    # Insert modules aligned with ERP functional areas
    modules_data = [
        {
            'id': str(uuid.uuid4()),
            'code': 'master_data',
            'name': 'Master Data',
            'description': 'Catalogue foundational business references',
            'sort_order': 1,
            'icon': 'database'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'finance',
            'name': 'Finance',
            'description': 'Manage cash, journals, and statutory reporting',
            'sort_order': 2,
            'icon': 'wallet'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'inventory',
            'name': 'Inventory',
            'description': 'Monitor and control stock movements',
            'sort_order': 3,
            'icon': 'boxes'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'purchasing',
            'name': 'Purchasing',
            'description': 'Procurement lifecycle from request to invoice',
            'sort_order': 4,
            'icon': 'shopping-cart'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'sales',
            'name': 'Sales',
            'description': 'Quote-to-cash activities and analytics',
            'sort_order': 5,
            'icon': 'trending-up'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'manufacturing',
            'name': 'Manufacturing',
            'description': 'Production planning and execution',
            'sort_order': 6,
            'icon': 'factory'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'administration',
            'name': 'Administration',
            'description': 'Tenant administration and access control',
            'sort_order': 7,
            'icon': 'shield'
        }
    ]

    module_id_map = {}
    for module in modules_data:
        result = connection.execute(
            sa.text("""
                INSERT INTO modules (id, code, name, description, sort_order, icon, is_active, created_at)
                VALUES (:id, :code, :name, :description, :sort_order, :icon, true, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    sort_order = EXCLUDED.sort_order,
                    icon = EXCLUDED.icon,
                    is_active = true
                RETURNING id
            """),
            module
        )
        module_id = result.scalar()
        if module_id is None:
            module_id = connection.execute(
                sa.text("SELECT id FROM modules WHERE code = :code"),
                {"code": module["code"]}
            ).scalar()
        module_id_map[module['code']] = module_id

    menu_items_data = []
    for module_code, items in MENU_STRUCTURE.items():
        for index, item in enumerate(items, start=1):
            menu_items_data.append({
                'id': str(uuid.uuid4()),
                'module_code': module_code,
                'code': item['code'],
                'name': item['name'],
                'description': item.get('description'),
                'route': item['route'],
                'permission_key': item['permission_key'],
                'sort_order': item.get('sort_order', index),
                'icon': item.get('icon')
            })

    menu_code_to_id = {}
    menu_sort_key = {}
    for item in menu_items_data:
        module_id = module_id_map[item['module_code']]
        payload = {
            'id': item['id'],
            'module_id': module_id,
            'code': item['code'],
            'name': item['name'],
            'description': item['description'],
            'route': item['route'],
            'permission_key': item['permission_key'],
            'sort_order': item['sort_order'],
            'icon': item['icon']
        }
        result = connection.execute(
            sa.text("""
                INSERT INTO menu_items (id, module_id, code, name, description, route, permission_key, sort_order, icon, is_active, created_at)
                VALUES (:id, :module_id, :code, :name, :description, :route, :permission_key, :sort_order, :icon, true, NOW())
                ON CONFLICT (module_id, code) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    route = EXCLUDED.route,
                    permission_key = EXCLUDED.permission_key,
                    sort_order = EXCLUDED.sort_order,
                    icon = EXCLUDED.icon,
                    is_active = true
                RETURNING id
            """),
            payload
        )
        menu_id = result.scalar()
        if menu_id is None:
            menu_id = connection.execute(
                sa.text("SELECT id FROM menu_items WHERE module_id = :module_id AND code = :code"),
                {'module_id': module_id, 'code': item['code']}
            ).scalar()
        menu_code_to_id[item['code']] = menu_id
        menu_sort_key[item['code']] = (item['module_code'], item['sort_order'], item['name'])

    # Subscription plan menu allocations
    all_menu_codes = set(menu_code_to_id.keys())

    basic_menu_codes = {
        'master_products',
        'master_product_categories',
        'master_contacts',
        'master_units',
        'master_currencies',
        'master_taxes',
        'master_payment_terms',
        'finance_cash_bank_in',
        'finance_cash_bank_out',
        'finance_ar_payment',
        'sales_sales_quotation',
        'sales_sales_order',
        'sales_sales_invoice',
        'purchasing_purchase_request',
        'purchasing_purchase_order',
        'inventory_stock_opname',
        'inventory_stock_adjustment',
        'admin_users',
        'admin_roles'
    }

    professional_menu_codes = basic_menu_codes | {
        'master_chart_of_accounts',
        'master_locations',
        'finance_journal_general',
        'finance_ap_payment',
        'finance_report_general_ledger',
        'finance_report_balance_sheet',
        'finance_report_cash_flow',
        'inventory_product_mutation',
        'inventory_report_stock_card',
        'inventory_report_inventory',
        'purchasing_request_for_quotation',
        'purchasing_goods_receipt',
        'purchasing_receive_invoice',
        'purchasing_purchase_return',
        'purchasing_tukar_faktur',
        'purchasing_report_purchase',
        'sales_sales_return',
        'sales_pos',
        'sales_report_sales',
        'sales_report_salesperson',
        'sales_report_customer',
        'sales_report_item',
        'manufacturing_bill_of_material',
        'manufacturing_production_order',
        'manufacturing_work_center'
    }

    enterprise_menu_codes = all_menu_codes

    def validate_menu_codes(plan_label: str, codes: set[str]) -> None:
        missing = sorted(codes.difference(all_menu_codes))
        if missing:
            raise RuntimeError(f"Unknown menu codes for {plan_label}: {', '.join(missing)}")

    validate_menu_codes('basic', basic_menu_codes)
    validate_menu_codes('professional', professional_menu_codes)
    validate_menu_codes('enterprise', enterprise_menu_codes)

    def attach_menu_items(plan_code: str, menu_codes: set[str]) -> None:
        plan_id = plan_id_map[plan_code]
        for code in sorted(menu_codes, key=lambda c: menu_sort_key[c]):
            connection.execute(
                sa.text("""
                    INSERT INTO plan_menu_items (id, plan_id, menu_item_id, is_included, created_at)
                    VALUES (:id, :plan_id, :menu_item_id, true, NOW())
                    ON CONFLICT (plan_id, menu_item_id) DO UPDATE SET
                        is_included = EXCLUDED.is_included
                """),
                {
                    'id': str(uuid.uuid4()),
                    'plan_id': plan_id,
                    'menu_item_id': menu_code_to_id[code]
                }
            )

    attach_menu_items('basic', basic_menu_codes)
    attach_menu_items('professional', professional_menu_codes)
    attach_menu_items('enterprise', enterprise_menu_codes)


def downgrade() -> None:
    # Clear all seeded data
    connection = op.get_bind()
    
    connection.execute(sa.text("DELETE FROM plan_menu_items"))
    connection.execute(sa.text("DELETE FROM menu_items"))
    connection.execute(sa.text("DELETE FROM modules"))
    connection.execute(sa.text("DELETE FROM subscription_plans"))
