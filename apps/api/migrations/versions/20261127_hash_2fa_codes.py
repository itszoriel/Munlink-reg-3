"""Store 2FA codes as HMAC digests instead of plain text.

Widens email_verification_codes.code to 64 characters (hex SHA-256) and retires
every outstanding plain-text code; anyone mid-login simply requests a new code.

Revision ID: 20261127_hash_2fa_codes
Revises: 20261127_location_active
"""
from alembic import op
import sqlalchemy as sa


revision = '20261127_hash_2fa_codes'
down_revision = '20261127_location_active'
branch_labels = None
depends_on = None


def upgrade():
    op.execute(sa.text("UPDATE email_verification_codes SET used = true WHERE used = false"))
    with op.batch_alter_table('email_verification_codes') as batch:
        batch.alter_column('code', existing_type=sa.String(6), type_=sa.String(64), existing_nullable=False)


def downgrade():
    # Digests do not fit back into six characters; retire them all first.
    op.execute(sa.text("DELETE FROM email_verification_codes"))
    with op.batch_alter_table('email_verification_codes') as batch:
        batch.alter_column('code', existing_type=sa.String(64), type_=sa.String(6), existing_nullable=False)
