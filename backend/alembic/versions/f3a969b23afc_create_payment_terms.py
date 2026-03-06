"""create-payment-terms

Revision ID: f3a969b23afc
Revises: 6f779186f86a
Create Date: 2025-10-06 09:27:30.682104

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'f3a969b23afc'
down_revision = '6f779186f86a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create payment_terms table
    op.create_table(
        "payment_terms",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("due_days", sa.Integer(), nullable=False),
        sa.Column("early_payment_discount_percent", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("early_payment_discount_days", sa.Integer(), nullable=True),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("updated_by", sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], name="fk_payment_terms_tenant_id"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "code", name="uq_payment_terms_tenant_code"),
    )

    # Add payment_term_id column to contacts table
    op.add_column(
        "contacts",
        sa.Column("payment_term_id", sa.UUID(), nullable=True)
    )

    # Create foreign key constraint for contacts.payment_term_id
    op.create_foreign_key(
        "fk_contacts_payment_term_id",
        "contacts", "payment_terms",
        ["payment_term_id"], ["id"]
    )


def downgrade() -> None:
    op.drop_table("contacts")