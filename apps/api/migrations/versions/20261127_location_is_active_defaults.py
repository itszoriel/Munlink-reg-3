"""Location rows are active unless explicitly disabled.

The location seed inserted provinces, municipalities and barangays without
`is_active`, leaving it NULL. The API filters on `is_active = true`, so the
public site listed no Zambales municipalities and residents could not register.
Backfill NULL to true, then add a server default and NOT NULL so raw-SQL seeds
cannot reintroduce it. Rows explicitly set to false are left alone.

Revision ID: 20261127_location_active
Revises: 20260224_benefit_app_unique
"""
from alembic import op
import sqlalchemy as sa


revision = '20261127_location_active'
down_revision = '20260224_benefit_app_unique'
branch_labels = None
depends_on = None

TABLES = ('provinces', 'municipalities', 'barangays')


def upgrade():
    for table in TABLES:
        op.execute(sa.text(f"UPDATE {table} SET is_active = true WHERE is_active IS NULL"))
        with op.batch_alter_table(table) as batch:
            batch.alter_column(
                'is_active',
                existing_type=sa.Boolean(),
                nullable=False,
                server_default=sa.true(),
            )


def downgrade():
    for table in TABLES:
        with op.batch_alter_table(table) as batch:
            batch.alter_column(
                'is_active',
                existing_type=sa.Boolean(),
                nullable=True,
                server_default=None,
            )
