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

import add_permission_management_tables  # type: ignore

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
    
    # Insert subscription plans
    for plan in plans_data:
        connection.execute(
            sa.text("""
                INSERT INTO subscription_plans (id, code, name, description, price_monthly, price_yearly, sort_order, is_active, created_at)
                VALUES (:id, :code, :name, :description, :price_monthly, :price_yearly, :sort_order, true, NOW())
            """),
            plan
        )
    
    # Insert modules
    modules_data = [
        {
            'id': str(uuid.uuid4()),
            'code': 'master_data',
            'name': 'Master Data',
            'description': 'Manage core business data',
            'sort_order': 1,
            'icon': 'database'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'sales',
            'name': 'Sales',
            'description': 'Sales management and invoicing',
            'sort_order': 2,
            'icon': 'trending-up'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'purchasing',
            'name': 'Purchasing',
            'description': 'Purchase orders and vendor management',
            'sort_order': 3,
            'icon': 'shopping-cart'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'inventory',
            'name': 'Inventory',
            'description': 'Stock and warehouse management',
            'sort_order': 4,
            'icon': 'package'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'finance',
            'name': 'Finance',
            'description': 'Accounting and financial reports',
            'sort_order': 5,
            'icon': 'dollar-sign'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'manufacturing',
            'name': 'Manufacturing',
            'description': 'Production and BOM management',
            'sort_order': 6,
            'icon': 'settings'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'reports',
            'name': 'Reports',
            'description': 'Business intelligence and analytics',
            'sort_order': 7,
            'icon': 'bar-chart'
        },
        {
            'id': str(uuid.uuid4()),
            'code': 'administration',
            'name': 'Administration',
            'description': 'System administration and user management',
            'sort_order': 8,
            'icon': 'shield'
        }
    ]
    
    # Insert modules
    module_id_map = {}
    for module in modules_data:
        connection.execute(
            sa.text("""
                INSERT INTO modules (id, code, name, description, sort_order, icon, is_active, created_at)
                VALUES (:id, :code, :name, :description, :sort_order, :icon, true, NOW())
            """),
            module
        )
        module_id_map[module['code']] = module['id']
    
    # Insert menu items
    menu_items_data = [
        # Master Data
        {
            'id': str(uuid.uuid4()),
            'module_code': 'master_data',
            'code': 'products',
            'name': 'Products',
            'route': '/master-data/products',
            'permission_key': 'products.view',
            'sort_order': 1,
            'icon': 'box'
        },
        {
            'id': str(uuid.uuid4()),
            'module_code': 'master_data',
            'code': 'contacts',
            'name': 'Contacts',
            'route': '/master-data/contacts',
            'permission_key': 'contacts.view',
            'sort_order': 2,
            'icon': 'users'
        },
        {
            'id': str(uuid.uuid4()),
            'module_code': 'master_data',
            'code': 'categories',
            'name': 'Categories',
            'route': '/master-data/categories',
            'permission_key': 'categories.view',
            'sort_order': 3,
            'icon': 'tag'
        },
        
        # Sales
        {
            'id': str(uuid.uuid4()),
            'module_code': 'sales',
            'code': 'invoices',
            'name': 'Invoices',
            'route': '/sales/invoices',
            'permission_key': 'sales.invoices.view',
            'sort_order': 1,
            'icon': 'file-text'
        },
        {
            'id': str(uuid.uuid4()),
            'module_code': 'sales',
            'code': 'sales_orders',
            'name': 'Sales Orders',
            'route': '/sales/orders',
            'permission_key': 'sales.orders.view',
            'sort_order': 2,
            'icon': 'shopping-bag'
        },
        {
            'id': str(uuid.uuid4()),
            'module_code': 'sales',
            'code': 'customers',
            'name': 'Customers',
            'route': '/sales/customers',
            'permission_key': 'sales.customers.view',
            'sort_order': 3,
            'icon': 'user-check'
        },
        
        # Purchasing
        {
            'id': str(uuid.uuid4()),
            'module_code': 'purchasing',
            'code': 'purchase_orders',
            'name': 'Purchase Orders',
            'route': '/purchasing/orders',
            'permission_key': 'purchasing.orders.view',
            'sort_order': 1,
            'icon': 'clipboard-list'
        },
        {
            'id': str(uuid.uuid4()),
            'module_code': 'purchasing',
            'code': 'purchase_invoices',
            'name': 'Purchase Invoices',
            'route': '/purchasing/invoices',
            'permission_key': 'purchasing.invoices.view',
            'sort_order': 2,
            'icon': 'receipt'
        },
        {
            'id': str(uuid.uuid4()),
            'module_code': 'purchasing',
            'code': 'vendors',
            'name': 'Vendors',
            'route': '/purchasing/vendors',
            'permission_key': 'purchasing.vendors.view',
            'sort_order': 3,
            'icon': 'truck'
        },
        
        # Administration
        {
            'id': str(uuid.uuid4()),
            'module_code': 'administration',
            'code': 'users',
            'name': 'User Management',
            'route': '/admin/users',
            'permission_key': 'users.view',
            'sort_order': 1,
            'icon': 'users'
        },
        {
            'id': str(uuid.uuid4()),
            'module_code': 'administration',
            'code': 'roles',
            'name': 'Role Management',
            'route': '/admin/roles',
            'permission_key': 'roles.view',
            'sort_order': 2,
            'icon': 'shield'
        }
    ]
    
    # Insert menu items
    menu_item_ids = []
    for item in menu_items_data:
        module_id = module_id_map[item['module_code']]
        connection.execute(
            sa.text("""
                INSERT INTO menu_items (id, module_id, code, name, route, permission_key, sort_order, icon, is_active, created_at)
                VALUES (:id, :module_id, :code, :name, :route, :permission_key, :sort_order, :icon, true, NOW())
            """),
            {
                'id': item['id'],
                'module_id': module_id,
                'code': item['code'],
                'name': item['name'],
                'route': item['route'],
                'permission_key': item['permission_key'],
                'sort_order': item['sort_order'],
                'icon': item['icon']
            }
        )
        menu_item_ids.append(item['id'])
    
    # Set up plan menu items
    basic_menu_items = ['products', 'contacts', 'invoices', 'purchase_orders']
    professional_menu_items = ['products', 'contacts', 'categories', 'invoices', 'sales_orders', 'customers', 
                              'purchase_orders', 'purchase_invoices', 'vendors']
    enterprise_menu_items = [item['code'] for item in menu_items_data]  # All items
    
    # Get plan IDs
    plan_results = connection.execute(sa.text("SELECT id, code FROM subscription_plans")).fetchall()
    plan_id_map = {row[1]: row[0] for row in plan_results}
    
    # Get menu item IDs by code
    menu_results = connection.execute(sa.text("SELECT id, code FROM menu_items")).fetchall()
    menu_code_to_id = {row[1]: row[0] for row in menu_results}
    
    # Insert plan menu items for basic plan
    for code in basic_menu_items:
        if code in menu_code_to_id:
            connection.execute(
                sa.text("""
                    INSERT INTO plan_menu_items (id, plan_id, menu_item_id, is_included, created_at)
                    VALUES (:id, :plan_id, :menu_item_id, true, NOW())
                """),
                {
                    'id': str(uuid.uuid4()),
                    'plan_id': plan_id_map['basic'],
                    'menu_item_id': menu_code_to_id[code]
                }
            )
    
    # Insert plan menu items for professional plan
    for code in professional_menu_items:
        if code in menu_code_to_id:
            connection.execute(
                sa.text("""
                    INSERT INTO plan_menu_items (id, plan_id, menu_item_id, is_included, created_at)
                    VALUES (:id, :plan_id, :menu_item_id, true, NOW())
                """),
                {
                    'id': str(uuid.uuid4()),
                    'plan_id': plan_id_map['professional'],
                    'menu_item_id': menu_code_to_id[code]
                }
            )
    
    # Insert plan menu items for enterprise plan (all items)
    for code in enterprise_menu_items:
        if code in menu_code_to_id:
            connection.execute(
                sa.text("""
                    INSERT INTO plan_menu_items (id, plan_id, menu_item_id, is_included, created_at)
                    VALUES (:id, :plan_id, :menu_item_id, true, NOW())
                """),
                {
                    'id': str(uuid.uuid4()),
                    'plan_id': plan_id_map['enterprise'],
                    'menu_item_id': menu_code_to_id[code]
                }
            )


def downgrade() -> None:
    # Clear all seeded data
    connection = op.get_bind()
    
    connection.execute(sa.text("DELETE FROM plan_menu_items"))
    connection.execute(sa.text("DELETE FROM menu_items"))
    connection.execute(sa.text("DELETE FROM modules"))
    connection.execute(sa.text("DELETE FROM subscription_plans"))
