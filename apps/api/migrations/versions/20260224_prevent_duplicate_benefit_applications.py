"""Prevent duplicate benefit applications per resident/program.

Revision ID: 20260224_benefit_app_unique
Revises: 20260205_office_payment_ver
Create Date: 2026-02-24
"""
from __future__ import annotations

import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260224_benefit_app_unique"
down_revision = "20260205_office_payment_ver"
branch_labels = None
depends_on = None


def _normalize_docs(value):
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item).strip() for item in value if str(item).strip()]
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return []
        try:
            parsed = json.loads(raw)
            if isinstance(parsed, list):
                return [str(item).strip() for item in parsed if str(item).strip()]
        except Exception:
            pass
        return [raw]
    text = str(value).strip()
    return [text] if text else []


def _status_priority(status_value):
    status = (status_value or "").strip().lower()
    return {
        "approved": 5,
        "under_review": 4,
        "pending": 3,
        "rejected": 2,
        "cancelled": 1,
    }.get(status, 0)


def _pick_keep_row(rows):
    def _sort_key(row):
        updated = row.updated_at or row.created_at
        updated_ts = 0.0
        if updated is not None:
            try:
                updated_ts = float(updated.timestamp())
            except Exception:
                updated_ts = 0.0
        return (_status_priority(row.status), updated_ts, row.id)

    return sorted(rows, key=_sort_key, reverse=True)[0]


def upgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    if not inspector.has_table("benefit_applications"):
        return

    benefit_apps = sa.table(
        "benefit_applications",
        sa.column("id", sa.Integer()),
        sa.column("user_id", sa.Integer()),
        sa.column("program_id", sa.Integer()),
        sa.column("status", sa.String(length=20)),
        sa.column("supporting_documents", sa.JSON()),
        sa.column("created_at", sa.DateTime()),
        sa.column("updated_at", sa.DateTime()),
    )

    duplicate_pairs = bind.execute(
        sa.select(benefit_apps.c.user_id, benefit_apps.c.program_id)
        .group_by(benefit_apps.c.user_id, benefit_apps.c.program_id)
        .having(sa.func.count(benefit_apps.c.id) > 1)
    ).fetchall()

    for pair in duplicate_pairs:
        rows = bind.execute(
            sa.select(
                benefit_apps.c.id,
                benefit_apps.c.status,
                benefit_apps.c.supporting_documents,
                benefit_apps.c.created_at,
                benefit_apps.c.updated_at,
            )
            .where(
                sa.and_(
                    benefit_apps.c.user_id == pair.user_id,
                    benefit_apps.c.program_id == pair.program_id,
                )
            )
        ).fetchall()

        if len(rows) < 2:
            continue

        keep_row = _pick_keep_row(rows)
        merged_docs = []
        seen = set()
        for row in rows:
            for doc in _normalize_docs(row.supporting_documents):
                if doc in seen:
                    continue
                seen.add(doc)
                merged_docs.append(doc)

        bind.execute(
            benefit_apps.update()
            .where(benefit_apps.c.id == keep_row.id)
            .values(supporting_documents=merged_docs)
        )

        remove_ids = [row.id for row in rows if row.id != keep_row.id]
        if remove_ids:
            bind.execute(
                benefit_apps.delete().where(benefit_apps.c.id.in_(remove_ids))
            )

    inspector = sa.inspect(bind)
    unique_constraints = {
        uc.get("name")
        for uc in inspector.get_unique_constraints("benefit_applications")
        if uc.get("name")
    }
    if "uq_benefit_app_user_program" not in unique_constraints:
        with op.batch_alter_table("benefit_applications", schema=None) as batch_op:
            batch_op.create_unique_constraint(
                "uq_benefit_app_user_program",
                ["user_id", "program_id"],
            )


def downgrade():
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if not inspector.has_table("benefit_applications"):
        return

    unique_constraints = {
        uc.get("name")
        for uc in inspector.get_unique_constraints("benefit_applications")
        if uc.get("name")
    }
    if "uq_benefit_app_user_program" in unique_constraints:
        with op.batch_alter_table("benefit_applications", schema=None) as batch_op:
            batch_op.drop_constraint("uq_benefit_app_user_program", type_="unique")
