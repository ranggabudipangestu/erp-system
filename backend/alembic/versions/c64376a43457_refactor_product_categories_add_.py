"""refactor_product_categories_add_hierarchy

Revision ID: c64376a43457
Revises: d86c9c102998
Create Date: 2026-03-07 06:59:21.474492

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'c64376a43457'
down_revision = 'd86c9c102998'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns
    op.add_column('product_categories', sa.Column('tenant_id', sa.UUID(), nullable=True))
    op.add_column('product_categories', sa.Column('code', sa.String(length=50), nullable=True))
    op.add_column('product_categories', sa.Column('parent_id', sa.UUID(), nullable=True))
    op.add_column('product_categories', sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True))

    # Backfill existing rows: set tenant_id from a default tenant if exists, code from name
    op.execute("""
        UPDATE product_categories
        SET tenant_id = (SELECT id FROM tenants LIMIT 1),
            code = UPPER(REPLACE(LEFT(name, 50), ' ', '_'))
        WHERE tenant_id IS NULL
    """)

    # Make columns non-nullable after backfill
    op.alter_column('product_categories', 'tenant_id', nullable=False)
    op.alter_column('product_categories', 'code', nullable=False)

    # Drop old unique constraint on name, add new one on (tenant_id, code)
    op.drop_constraint('product_categories_name_key', 'product_categories', type_='unique')
    op.create_unique_constraint('uq_product_categories_tenant_code', 'product_categories', ['tenant_id', 'code'])

    # Add foreign keys
    op.create_foreign_key('fk_product_categories_tenant', 'product_categories', 'tenants', ['tenant_id'], ['id'])
    op.create_foreign_key('fk_product_categories_parent', 'product_categories', 'product_categories', ['parent_id'], ['id'])

    # Drop is_active
    op.drop_column('product_categories', 'is_active')


def downgrade() -> None:
    op.add_column('product_categories', sa.Column('is_active', sa.BOOLEAN(), nullable=False, server_default=sa.text('true')))
    op.drop_constraint('fk_product_categories_parent', 'product_categories', type_='foreignkey')
    op.drop_constraint('fk_product_categories_tenant', 'product_categories', type_='foreignkey')
    op.drop_constraint('uq_product_categories_tenant_code', 'product_categories', type_='unique')
    op.create_unique_constraint('product_categories_name_key', 'product_categories', ['name'])
    op.drop_column('product_categories', 'deleted_at')
    op.drop_column('product_categories', 'parent_id')
    op.drop_column('product_categories', 'code')
    op.drop_column('product_categories', 'tenant_id')