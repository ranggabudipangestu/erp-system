"""Add permission management tables

Revision ID: permission_tables_001
Revises: 9607019bb0dc
Create Date: 2024-09-13 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'permission_tables_001'
down_revision = '9607019bb0dc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create subscription_plans table
    op.create_table('subscription_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price_monthly', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('price_yearly', sa.DECIMAL(precision=10, scale=2), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    # Create modules table
    op.create_table('modules',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('parent_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['parent_id'], ['modules.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('code')
    )
    
    # Create menu_items table
    op.create_table('menu_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('module_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('route', sa.String(length=200), nullable=True),
        sa.Column('permission_key', sa.String(length=100), nullable=False),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('icon', sa.String(length=50), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['module_id'], ['modules.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('module_id', 'code', name='uq_menu_items_module_code')
    )
    
    # Create plan_menu_items table
    op.create_table('plan_menu_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('menu_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('is_included', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['plan_id'], ['subscription_plans.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('plan_id', 'menu_item_id', name='uq_plan_menu_items_plan_menu')
    )
    
    # Create role_permissions table
    op.create_table('role_permissions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('menu_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('can_view', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_create', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_edit', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_delete', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('can_export', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['menu_item_id'], ['menu_items.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['role_id'], ['roles.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('role_id', 'menu_item_id', name='uq_role_permissions_role_menu')
    )
    
    # Add subscription_plan_id to tenants table
    op.add_column('tenants', sa.Column('subscription_plan_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key('fk_tenants_subscription_plan', 'tenants', 'subscription_plans', ['subscription_plan_id'], ['id'])
    
    # Create indexes for better performance
    op.create_index('idx_modules_parent_id', 'modules', ['parent_id'])
    op.create_index('idx_menu_items_module_id', 'menu_items', ['module_id'])
    op.create_index('idx_plan_menu_items_plan_id', 'plan_menu_items', ['plan_id'])
    op.create_index('idx_role_permissions_role_id', 'role_permissions', ['role_id'])
    op.create_index('idx_role_permissions_menu_item_id', 'role_permissions', ['menu_item_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_role_permissions_menu_item_id', 'role_permissions')
    op.drop_index('idx_role_permissions_role_id', 'role_permissions')
    op.drop_index('idx_plan_menu_items_plan_id', 'plan_menu_items')
    op.drop_index('idx_menu_items_module_id', 'menu_items')
    op.drop_index('idx_modules_parent_id', 'modules')
    
    # Remove subscription_plan_id from tenants
    op.drop_constraint('fk_tenants_subscription_plan', 'tenants', type_='foreignkey')
    op.drop_column('tenants', 'subscription_plan_id')
    
    # Drop tables in reverse order
    op.drop_table('role_permissions')
    op.drop_table('plan_menu_items')
    op.drop_table('menu_items')
    op.drop_table('modules')
    op.drop_table('subscription_plans')