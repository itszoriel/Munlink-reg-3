"""
Correct the residency line on seeded Marriage License document types.

The original seed template copied a Pampanga (Porac) requirement into every
Zambales municipality: "at least one applicant is a resident of Porac". This
script rewrites that line to the template's corrected wording. It only touches
rows whose code ends in MARRIAGE_LICENSE and whose requirements mention Porac.

Usage (from apps/api, uses DATABASE_URL from .env):
    python scripts/fix_marriage_license_residency.py           # dry run
    python scripts/fix_marriage_license_residency.py --apply   # write changes
"""
import os
import sys

api_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
project_root = os.path.abspath(os.path.join(api_root, '../..'))
for path in (api_root, project_root):
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from app import create_app
    from apps.api import db
    from apps.api.models.document import DocumentType
except ImportError:
    from apps.api.app import create_app
    from apps.api import db
    from apps.api.models.document import DocumentType

CORRECT_LINE = (
    'Applicants must be male and female; at least one applicant is a resident '
    'of this municipality'
)


def fix_requirements(requirements):
    """Return (new_list, changed) with any Porac residency line replaced."""
    if not isinstance(requirements, list):
        return requirements, False
    changed = False
    out = []
    for item in requirements:
        if isinstance(item, str) and 'porac' in item.lower() and 'resident' in item.lower():
            out.append(CORRECT_LINE)
            changed = True
        else:
            out.append(item)
    return out, changed


def main(apply: bool) -> int:
    app = create_app()
    with app.app_context():
        rows = (
            DocumentType.query
            .filter(DocumentType.code.like('%MARRIAGE_LICENSE%'))
            .order_by(DocumentType.id)
            .all()
        )
        to_fix = []
        for row in rows:
            new_reqs, changed = fix_requirements(row.requirements)
            if changed:
                to_fix.append((row, new_reqs))

        print(f'Marriage license rows: {len(rows)}; mentioning Porac: {len(to_fix)}')
        for row, _ in to_fix:
            print(f'  id={row.id} code={row.code}')

        if not apply:
            print('Dry run only. Re-run with --apply to write the changes.')
            return 0

        for row, new_reqs in to_fix:
            row.requirements = new_reqs  # reassign so SQLAlchemy sees the JSON change
        db.session.commit()
        print(f'Updated {len(to_fix)} row(s).')
        return 0


if __name__ == '__main__':
    sys.exit(main('--apply' in sys.argv[1:]))
