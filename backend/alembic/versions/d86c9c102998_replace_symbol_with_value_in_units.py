"""replace_symbol_with_value_in_units

Revision ID: d86c9c102998
Revises: e9cce9db939f
Create Date: 2026-03-07 06:38:06.183372

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'd86c9c102998'
down_revision = 'e9cce9db939f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add the new 'value' column with a default of 1
    op.add_column('units', sa.Column('value', sa.Numeric(precision=15, scale=4), nullable=False, server_default='1'))
    # Drop the old 'symbol' column
    op.drop_column('units', 'symbol')


def downgrade() -> None:
    op.add_column('units', sa.Column('symbol', sa.VARCHAR(length=20), autoincrement=False, nullable=False, server_default=''))
    op.drop_column('units', 'value')