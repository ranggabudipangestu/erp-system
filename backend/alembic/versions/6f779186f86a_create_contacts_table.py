"""create contacts table

Revision ID: 6f779186f86a
Revises: seed_default_roles
Create Date: 2025-09-26 23:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "6f779186f86a"
down_revision = "seed_default_roles"
branch_labels = None
depends_on = None


STATUS_VALUES = ("Active", "Archived")


def upgrade() -> None:
    # Ensure a clean slate when rerunning the migration after partial failures
    op.execute("DROP TABLE IF EXISTS contacts CASCADE")
    op.execute("DROP TYPE IF EXISTS contact_status")

    # Create the enum type using raw SQL to avoid issues with checkfirst=False
    op.execute("CREATE TYPE contact_status AS ENUM ('Active', 'Archived')")

    # Now reference the existing enum type
    contact_status_enum = postgresql.ENUM(
        *STATUS_VALUES,
        name="contact_status",
        create_type=False,  # Don't create the type, it already exists
    )

    op.create_table(
        "contacts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("tenant_id", sa.UUID(), nullable=False),
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=True),
        sa.Column("phone", sa.String(length=50), nullable=True),
        sa.Column("address_billing", sa.Text(), nullable=True),
        sa.Column("address_shipping", sa.Text(), nullable=True),
        sa.Column("tax_number", sa.String(length=50), nullable=True),
        sa.Column(
            "roles",
            postgresql.ARRAY(sa.String(length=20)),
            nullable=False,
            server_default=sa.text("'{}'::varchar[]"),
        ),
        sa.Column("status", contact_status_enum, nullable=False, server_default="Active"),
        sa.Column("credit_limit", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("distribution_channel", sa.String(length=100), nullable=True),
        sa.Column("pic_name", sa.String(length=150), nullable=True),
        sa.Column("bank_account_number", sa.String(length=100), nullable=True),
        sa.Column("payment_terms", sa.String(length=100), nullable=True),
        sa.Column("sales_contact_name", sa.String(length=150), nullable=True),
        sa.Column("employee_id", sa.String(length=100), nullable=True),
        sa.Column("department", sa.String(length=100), nullable=True),
        sa.Column("job_title", sa.String(length=100), nullable=True),
        sa.Column("employment_status", sa.String(length=50), nullable=True),
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by", sa.String(length=100), nullable=False),
        sa.Column("updated_by", sa.String(length=100), nullable=True),
        sa.ForeignKeyConstraint(["tenant_id"], ["tenants.id"], name="fk_contacts_tenant_id"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("tenant_id", "code", name="uq_contacts_tenant_code"),
    )


def downgrade() -> None:
    op.drop_table("contacts")
    op.execute("DROP TYPE IF EXISTS contact_status")