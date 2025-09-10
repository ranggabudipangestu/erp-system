"""set tenant id to nullable

Revision ID: 9607019bb0dc
Revises: 7a27e732c4f5
Create Date: 2025-09-10 13:31:27.033576

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '9607019bb0dc'
down_revision = '7a27e732c4f5'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make audit_logs.tenant_id nullable to allow system-scoped logs
    op.alter_column(
        'audit_logs',
        'tenant_id',
        existing_type=sa.UUID(),
        nullable=True
    )


def downgrade() -> None:
    # Revert to NOT NULL (may fail if nulls exist)
    op.alter_column(
        'audit_logs',
        'tenant_id',
        existing_type=sa.UUID(),
        nullable=False
    )
