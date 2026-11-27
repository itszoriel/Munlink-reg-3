"""Mark document fees as confirmed or indicative, and record the uploaded ID type.

document_types.fee_confirmed starts false for every existing row: the seeded
fees are templates until each office confirms them, and the resident site
labels unconfirmed fees as indicative.

Revision ID: 20261128_fee_confirmed_id_type
Revises: 20261127_hash_2fa_codes
"""
from alembic import op
import sqlalchemy as sa


revision = '20261128_fee_confirmed_id_type'
down_revision = '20261127_hash_2fa_codes'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('document_types') as batch:
        batch.add_column(sa.Column('fee_confirmed', sa.Boolean(), nullable=False, server_default=sa.false()))
    with op.batch_alter_table('users') as batch:
        batch.add_column(sa.Column('valid_id_type', sa.String(length=40), nullable=True))


def downgrade():
    with op.batch_alter_table('users') as batch:
        batch.drop_column('valid_id_type')
    with op.batch_alter_table('document_types') as batch:
        batch.drop_column('fee_confirmed')
