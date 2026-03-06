"""create chart of accounts table

Revision ID: a1b2c3d4e5f6
Revises: f3a969b23afc
Create Date: 2026-03-06 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'f3a969b23afc'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chart_of_accounts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("parent_id", sa.UUID(), nullable=True),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("account_type", sa.String(length=20), nullable=False),
        sa.Column("normal_balance", sa.String(length=6), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("updated_by", sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], name="fk_coa_tenant_id"),
        sa.ForeignKeyConstraint(["parent_id"], ["chart_of_accounts.id"], name="fk_coa_parent_id"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "code", name="uq_coa_tenant_code"),
    )
    op.create_index("ix_coa_tenant_id", "chart_of_accounts", ["tenant_id"])
    op.create_index("ix_coa_parent_id", "chart_of_accounts", ["parent_id"])
    op.create_index("ix_coa_account_type", "chart_of_accounts", ["account_type"])


def downgrade() -> None:
    op.drop_index("ix_coa_account_type", table_name="chart_of_accounts")
    op.drop_index("ix_coa_parent_id", table_name="chart_of_accounts")
    op.drop_index("ix_coa_tenant_id", table_name="chart_of_accounts")
    op.drop_table("chart_of_accounts")
