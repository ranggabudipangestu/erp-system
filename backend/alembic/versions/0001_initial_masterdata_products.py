"""Initial: create masterdata schema and Products table

Revision ID: 0001
Revises: 
Create Date: 2025-09-06 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create schema if not exists
    # op.execute("CREATE SCHEMA IF NOT EXISTS masterdata")

    # op.execute("CREATE TABLE IF NOT EXISTS")
    # Create Products table
    op.create_table(
        "Products",
        sa.Column("Id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("Code", sa.String(length=50), nullable=False, unique=True),
        sa.Column("Name", sa.String(length=200), nullable=False),
        sa.Column("Description", sa.String(length=1000), nullable=True),
        sa.Column("Category", sa.String(length=100), nullable=True),
        sa.Column("Brand", sa.String(length=50), nullable=True),
        sa.Column("Unit", sa.String(length=50), nullable=True),
        sa.Column("Price", sa.Numeric(18, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("CostPrice", sa.Numeric(18, 2), nullable=False, server_default=sa.text("0")),
        sa.Column("StockQuantity", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("MinimumStock", sa.Integer(), nullable=False, server_default=sa.text("0")),
        sa.Column("IsActive", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column(
            "ImageUrl",
            sa.String(length=500),
            nullable=True,
        ),
        sa.Column(
            "CreatedAt",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("now()"),
        ),
        sa.Column("UpdatedAt", sa.DateTime(timezone=True), nullable=True),
        sa.Column("CreatedBy", sa.String(length=100), nullable=False),
        sa.Column("UpdatedBy", sa.String(length=100), nullable=True),
        if_not_exists=True
    )


def downgrade() -> None:
    op.drop_table("Products", if_exists=True)

