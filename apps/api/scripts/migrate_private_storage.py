#!/usr/bin/env python3
"""
Move sensitive uploads out of the public Supabase bucket.

Resident IDs, selfies, document-request files, generated documents, claim and
document QR codes, benefit and special-status proofs, and payment proofs used to
be uploaded to the public bucket and stored in the database as public URLs.
This script copies each referenced object into the private bucket, rewrites the
database reference to a bare storage path, and can then delete the public copy.

It is a dry run unless --apply is given. Run it against dev first.

    # 1. Report what would change (--env current uses the API's own .env settings)
    python apps/api/scripts/migrate_private_storage.py --env dev

    # 2. Copy to the private bucket and rewrite database references
    python apps/api/scripts/migrate_private_storage.py --env dev --apply

    # 3. Same, and delete each public copy after its reference is rewritten
    python apps/api/scripts/migrate_private_storage.py --env dev --apply --delete-public

    # 4. Find sensitive files nobody references (public bucket: any age;
    #    private bucket: older than --min-age-days), then delete them
    python apps/api/scripts/migrate_private_storage.py --env dev --orphans
    python apps/api/scripts/migrate_private_storage.py --env dev --orphans --apply

Credentials come from DEV_* / PROD_* variables (see env.example.txt). Deploy the
private-storage API release before step 2, so new uploads already go to the
private bucket while old ones are moved.
"""
from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from io import BytesIO
from pathlib import Path
from typing import Any, Iterable, Optional
from urllib.parse import urlparse

PROJECT_ROOT = Path(__file__).resolve().parents[3]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from apps.api.utils.supabase_storage import (  # noqa: E402
    PRIVATE_CATEGORIES,
    parse_storage_url,
    path_category,
)

# (table, column, kind). "json" columns hold a list of references (strings, or
# objects with a path/url/file key).
REFERENCE_COLUMNS = (
    ('users', 'valid_id_front', 'text'),
    ('users', 'valid_id_back', 'text'),
    ('users', 'selfie_with_id', 'text'),
    ('users', 'proof_of_residency', 'text'),
    ('document_requests', 'document_file', 'text'),
    ('document_requests', 'qr_code', 'text'),
    ('document_requests', 'manual_payment_proof_path', 'text'),
    ('document_requests', 'supporting_documents', 'json'),
    ('benefit_applications', 'supporting_documents', 'json'),
    ('user_special_statuses', 'student_id_path', 'text'),
    ('user_special_statuses', 'cor_path', 'text'),
    ('user_special_statuses', 'pwd_id_path', 'text'),
    ('user_special_statuses', 'senior_id_path', 'text'),
)

JSON_REFERENCE_KEYS = ('path', 'url', 'file')
MAX_OBJECT_MB = 25


@dataclass(frozen=True)
class Plan:
    """What to do with one stored reference.

    action:
      move       object is in the public bucket; copy it to the private bucket
      normalize  object is already private but referenced by URL; store the path
      verify     relative private path; find out which bucket (if any) holds it
      external   URL outside the configured Supabase project; leave it alone
      skip       not a sensitive file
    """

    action: str
    path: str = ''
    bucket: str = ''


def classify_reference(ref: Any, supabase_url: str, public_bucket: str, private_bucket: str) -> Plan:
    """Decide what a stored reference needs, without touching the network."""
    raw = str(ref or '').strip().replace('\\', '/')
    if not raw:
        return Plan('skip')

    if raw.startswith(('http://', 'https://')):
        located = parse_storage_url(raw, supabase_url)
        if located is None:
            return Plan('external')
        bucket, path = located
        if bucket == private_bucket:
            return Plan('normalize', path, bucket)
        if path_category(path) not in PRIVATE_CATEGORIES:
            return Plan('skip', path, bucket)
        if bucket != public_bucket:
            return Plan('external', path, bucket)
        return Plan('move', path, bucket)

    path = raw.lstrip('/')
    if path_category(path) not in PRIVATE_CATEGORIES or '..' in path.split('/'):
        return Plan('skip', path)
    return Plan('verify', path)


def json_entries(value: Any) -> list:
    """Parse a JSON reference column into a list (tolerates strings and None)."""
    if value is None:
        return []
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except ValueError:
            return []
    return list(value) if isinstance(value, list) else []


def entry_reference(entry: Any) -> Optional[str]:
    if isinstance(entry, str):
        return entry
    if isinstance(entry, dict):
        for key in JSON_REFERENCE_KEYS:
            if entry.get(key):
                return str(entry[key])
    return None


def replace_entry_reference(entry: Any, new_ref: str) -> Any:
    if isinstance(entry, str):
        return new_ref
    updated = dict(entry)
    for key in JSON_REFERENCE_KEYS:
        if updated.get(key):
            updated[key] = new_ref
            return updated
    return updated


class Report:
    def __init__(self) -> None:
        self.counts: dict[str, int] = {}
        self.problems: list[str] = []

    def add(self, key: str, amount: int = 1) -> None:
        self.counts[key] = self.counts.get(key, 0) + amount

    def problem(self, message: str) -> None:
        self.problems.append(message)

    def print(self, title: str) -> None:
        print()
        print(title)
        print('-' * len(title))
        for key in sorted(self.counts):
            print(f"  {key:<40} {self.counts[key]}")
        if self.problems:
            print(f"\n  {len(self.problems)} item(s) need attention:")
            for message in self.problems[:50]:
                print(f"   - {message}")
            if len(self.problems) > 50:
                print(f"   ... and {len(self.problems) - 50} more")


class Migrator:
    def __init__(self, engine, storage, supabase_url: str, public_bucket: str, private_bucket: str,
                 apply: bool, delete_public: bool) -> None:
        self.engine = engine
        self.storage = storage
        self.supabase_url = supabase_url
        self.public_bucket = public_bucket
        self.private_bucket = private_bucket
        self.apply = apply
        self.delete_public = delete_public
        self.report = Report()
        self._copied: set[str] = set()
        self._located: dict[str, Optional[str]] = {}

    # -- storage helpers -------------------------------------------------

    def _locate(self, path: str) -> Optional[str]:
        """Bucket holding a relative path: private first, then public."""
        if path not in self._located:
            if self.storage.file_exists(path, bucket=self.private_bucket):
                self._located[path] = self.private_bucket
            elif self.storage.file_exists(path, bucket=self.public_bucket):
                self._located[path] = self.public_bucket
            else:
                self._located[path] = None
        return self._located[path]

    def _copy_to_private(self, path: str) -> bool:
        if path in self._copied:
            return True
        if not self.apply:
            self._copied.add(path)
            return True
        try:
            data, content_type = self.storage.download_file(path, bucket=self.public_bucket)
        except FileNotFoundError:
            if self.storage.file_exists(path, bucket=self.private_bucket):
                self._copied.add(path)  # moved by an earlier run
                return True
            self.report.problem(f"missing in public bucket: {path}")
            return False
        self.storage.upload_file_to_path(
            BytesIO(data),
            path,
            content_type=content_type or None,
            max_size_mb=MAX_OBJECT_MB,
            bucket=self.private_bucket,
            upsert=True,
        )
        if not self.storage.file_exists(path, bucket=self.private_bucket):
            self.report.problem(f"copy not visible in private bucket: {path}")
            return False
        self._copied.add(path)
        return True

    # -- per-reference ---------------------------------------------------

    def resolve(self, ref: str, where: str) -> Optional[str]:
        """Return the new reference for ``ref`` (None when it stays as is)."""
        plan = classify_reference(ref, self.supabase_url, self.public_bucket, self.private_bucket)
        if plan.action in ('skip',):
            return None
        if plan.action == 'external':
            self.report.add('external URL (left alone)')
            self.report.problem(f"{where}: URL outside the configured storage project")
            return None
        if plan.action == 'normalize':
            self.report.add('private URL -> path')
            return plan.path
        if plan.action == 'verify':
            bucket = self._locate(plan.path)
            if bucket == self.private_bucket:
                self.report.add('already private')
                return None
            if bucket is None:
                self.report.add('missing everywhere (local-only upload?)')
                self.report.problem(f"{where}: file not found in either bucket")
                return None
            plan = Plan('move', plan.path, bucket)

        # move
        if self._copy_to_private(plan.path):
            self.report.add('copied to private bucket' if self.apply else 'would copy to private bucket')
            return plan.path
        self.report.add('copy failed')
        return None

    def after_rewrite(self, old_ref: str, new_path: str) -> None:
        """Delete the public copy once the database no longer points at it."""
        if not (self.apply and self.delete_public):
            return
        if old_ref.startswith(('http://', 'https://')):
            located = parse_storage_url(old_ref, self.supabase_url)
            if not located or located[0] != self.public_bucket:
                return
        elif self._located.get(new_path) != self.public_bucket:
            return
        if self.storage.delete_file(new_path, bucket=self.public_bucket):
            self.report.add('public copy deleted')
        else:
            self.report.problem(f"could not delete public copy: {new_path}")

    # -- tables ----------------------------------------------------------

    def run(self) -> Report:
        from sqlalchemy import text

        for table, column, kind in REFERENCE_COLUMNS:
            if not self._column_exists(table, column):
                self.report.add(f"skipped missing column {table}.{column}")
                continue
            with self.engine.connect() as conn:
                rows = conn.execute(
                    text(f'SELECT id, "{column}" FROM "{table}" WHERE "{column}" IS NOT NULL')
                ).fetchall()
            for row_id, value in rows:
                where = f"{table}.{column} id={row_id}"
                if kind == 'json':
                    self._migrate_json(table, column, row_id, value, where)
                else:
                    self._migrate_text(table, column, row_id, value, where)
        return self.report

    def _column_exists(self, table: str, column: str) -> bool:
        from sqlalchemy import inspect

        inspector = inspect(self.engine)
        if not inspector.has_table(table):
            return False
        return any(col['name'] == column for col in inspector.get_columns(table))

    def _write(self, table: str, column: str, row_id: int, value: Any, is_json: bool) -> None:
        if not self.apply:
            return
        from sqlalchemy import bindparam, text
        from sqlalchemy.types import JSON

        statement = text(f'UPDATE "{table}" SET "{column}" = :value WHERE id = :id')
        if is_json:
            statement = statement.bindparams(bindparam('value', type_=JSON))
        with self.engine.begin() as conn:
            conn.execute(statement, {'value': value, 'id': row_id})

    def _migrate_text(self, table: str, column: str, row_id: int, value: Any, where: str) -> None:
        old_ref = str(value)
        new_ref = self.resolve(old_ref, where)
        if new_ref is None or new_ref == old_ref:
            return
        self._write(table, column, row_id, new_ref, is_json=False)
        self.report.add('references rewritten' if self.apply else 'references to rewrite')
        self.after_rewrite(old_ref, new_ref)

    def _migrate_json(self, table: str, column: str, row_id: int, value: Any, where: str) -> None:
        entries = json_entries(value)
        changed = []
        updated = []
        for index, entry in enumerate(entries):
            old_ref = entry_reference(entry)
            new_ref = self.resolve(old_ref, f"{where}[{index}]") if old_ref else None
            if new_ref and new_ref != old_ref:
                updated.append(replace_entry_reference(entry, new_ref))
                changed.append((old_ref, new_ref))
            else:
                updated.append(entry)
        if not changed:
            return
        self._write(table, column, row_id, updated, is_json=True)
        self.report.add('references rewritten' if self.apply else 'references to rewrite', len(changed))
        for old_ref, new_ref in changed:
            self.after_rewrite(old_ref, new_ref)

    # -- orphans ---------------------------------------------------------

    def referenced_paths(self) -> dict[str, set]:
        """Storage paths the database still points at, per bucket."""
        from sqlalchemy import text

        referenced: dict[str, set] = {self.public_bucket: set(), self.private_bucket: set()}
        for table, column, kind in REFERENCE_COLUMNS:
            if not self._column_exists(table, column):
                continue
            with self.engine.connect() as conn:
                rows = conn.execute(
                    text(f'SELECT "{column}" FROM "{table}" WHERE "{column}" IS NOT NULL')
                ).fetchall()
            for (value,) in rows:
                refs: Iterable[Optional[str]]
                refs = [entry_reference(e) for e in json_entries(value)] if kind == 'json' else [str(value)]
                for ref in refs:
                    plan = classify_reference(ref, self.supabase_url, self.public_bucket, self.private_bucket)
                    if plan.action in ('move', 'skip') and plan.bucket:
                        referenced.setdefault(plan.bucket, set()).add(plan.path)
                    elif plan.action in ('normalize', 'verify'):
                        # A bare path may live in either bucket until migrated.
                        referenced[self.private_bucket].add(plan.path)
                        referenced[self.public_bucket].add(plan.path)
        return referenced

    def find_orphans(self, min_age_days: int) -> list[tuple[str, str]]:
        referenced = self.referenced_paths()
        cutoff = datetime.now(timezone.utc) - timedelta(days=min_age_days)
        orphans = []
        for bucket in (self.public_bucket, self.private_bucket):
            for category in sorted(PRIVATE_CATEGORIES):
                for obj in self.storage.list_files(category, bucket=bucket):
                    path = obj['path']
                    if path in referenced.get(bucket, set()):
                        continue
                    if bucket == self.private_bucket and not _older_than(obj, cutoff):
                        continue  # may belong to an upload still in progress
                    orphans.append((bucket, path))
        return orphans


def _older_than(obj: dict, cutoff: datetime) -> bool:
    stamp = obj.get('created_at') or obj.get('updated_at')
    if not stamp:
        return False
    try:
        created = datetime.fromisoformat(str(stamp).replace('Z', '+00:00'))
    except ValueError:
        return False
    if created.tzinfo is None:
        created = created.replace(tzinfo=timezone.utc)
    return created < cutoff


def _ensure_private_bucket(supabase_url: str, service_key: str, bucket: str, apply: bool) -> bool:
    import requests

    headers = {'Authorization': f'Bearer {service_key}', 'apikey': service_key}
    response = requests.get(f"{supabase_url}/storage/v1/bucket/{bucket}", headers=headers, timeout=15)
    if response.status_code == 200:
        if (response.json() or {}).get('public'):
            print(f"ERROR: bucket '{bucket}' is public. Make it private in Supabase before migrating.")
            return False
        return True
    if not apply:
        print(f"Private bucket '{bucket}' does not exist yet; --apply will create it.")
        return True
    created = requests.post(
        f"{supabase_url}/storage/v1/bucket",
        headers={**headers, 'Content-Type': 'application/json'},
        json={'id': bucket, 'name': bucket, 'public': False, 'file_size_limit': MAX_OBJECT_MB * 1024 * 1024},
        timeout=15,
    )
    if created.status_code not in (200, 201):
        print(f"ERROR: could not create private bucket '{bucket}': {created.status_code}")
        return False
    print(f"Created private bucket '{bucket}'.")
    return True


def _storage_context(supabase_url: str, service_key: str, public_bucket: str, private_bucket: str):
    from flask import Flask

    app = Flask('migrate_private_storage')
    app.config.update(
        SUPABASE_URL=supabase_url,
        SUPABASE_SERVICE_KEY=service_key,
        SUPABASE_STORAGE_BUCKET=public_bucket,
        SUPABASE_PRIVATE_BUCKET=private_bucket,
    )
    return app.app_context()


def main(argv: Optional[list] = None) -> int:
    import os

    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--env', choices=('dev', 'prod', 'current'), required=True,
                        help="dev/prod use DEV_*/PROD_* variables; 'current' uses the API's own "
                             "DATABASE_URL, SUPABASE_URL and SUPABASE_SERVICE_KEY")
    parser.add_argument('--apply', action='store_true', help='make changes (default: dry run)')
    parser.add_argument('--delete-public', action='store_true',
                        help='after rewriting a reference, delete the public copy')
    parser.add_argument('--orphans', action='store_true',
                        help='report (or with --apply delete) unreferenced sensitive files')
    parser.add_argument('--min-age-days', type=int, default=7,
                        help='only treat private-bucket files older than this as orphans (default 7)')
    args = parser.parse_args(argv)

    # Importing db_environments also loads the git-ignored .env files.
    from apps.api.scripts.db_environments import get_service_key, get_sqlalchemy_engine, get_supabase_url
    from apps.api.utils import supabase_storage as storage

    if args.env == 'current':
        missing = [name for name in ('DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_KEY') if not os.getenv(name)]
        if missing:
            print(f"ERROR: set {', '.join(missing)} (or use --env dev/prod).")
            return 2
        supabase_url = os.environ['SUPABASE_URL'].rstrip('/')
        service_key = os.environ['SUPABASE_SERVICE_KEY']
    else:
        supabase_url = get_supabase_url(args.env).rstrip('/')
        service_key = get_service_key(args.env)
    public_bucket = os.getenv('SUPABASE_STORAGE_BUCKET', storage.STORAGE_BUCKET)
    private_bucket = os.getenv('SUPABASE_PRIVATE_BUCKET', storage.DEFAULT_PRIVATE_BUCKET)
    if public_bucket == private_bucket:
        print('ERROR: public and private bucket names are the same.')
        return 2

    mode = 'APPLY' if args.apply else 'DRY RUN'
    print(f"[{mode}] environment={args.env} project={urlparse(supabase_url).hostname} "
          f"public={public_bucket} private={private_bucket}")
    if args.env == 'prod' and args.apply:
        print('Running against PRODUCTION.')

    if not _ensure_private_bucket(supabase_url, service_key, private_bucket, args.apply):
        return 1

    if args.env == 'current':
        from sqlalchemy import create_engine

        engine = create_engine(os.environ['DATABASE_URL'], pool_pre_ping=True)
    else:
        engine = get_sqlalchemy_engine(args.env)
    with _storage_context(supabase_url, service_key, public_bucket, private_bucket):
        migrator = Migrator(engine, storage, supabase_url, public_bucket, private_bucket,
                            apply=args.apply, delete_public=args.delete_public)
        if args.orphans:
            orphans = migrator.find_orphans(args.min_age_days)
            print(f"\nUnreferenced sensitive files: {len(orphans)}")
            for bucket, path in orphans[:50]:
                print(f"  {bucket}/{path}")
            if len(orphans) > 50:
                print(f"  ... and {len(orphans) - 50} more")
            if args.apply:
                deleted = sum(1 for bucket, path in orphans if storage.delete_file(path, bucket=bucket))
                print(f"Deleted {deleted} of {len(orphans)}.")
            return 0

        report = migrator.run()
        report.print(f"[{mode}] private storage migration ({args.env})")
        if not args.apply:
            print('\nNothing was changed. Re-run with --apply to migrate.')
        return 1 if any(key == 'copy failed' for key in report.counts) else 0


if __name__ == '__main__':
    sys.exit(main())
