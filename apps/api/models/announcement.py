"""MunLink Region 3 - Announcement Model."""
from datetime import datetime, timezone
import json
from apps.api.utils.time import utc_now
from sqlalchemy import Index
from apps.api.utils.zambales_scope import (
    is_valid_zambales_municipality,
    validate_shared_municipalities,
)

try:
    from apps.api import db
except ImportError:
    from apps.api import db


def _to_naive_utc(dt):
    """Convert timezone-aware datetime to naive UTC for safe comparisons."""
    if not dt:
        return dt
    if dt.tzinfo:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def normalize_shared_municipality_ids(source_municipality_id, municipality_ids, *, strict: bool = True):
    """Normalize municipality-sharing targets for municipality announcements."""
    if municipality_ids in (None, '', []):
        return []

    if isinstance(municipality_ids, str):
        try:
            municipality_ids = json.loads(municipality_ids)
        except Exception:
            if strict:
                raise ValueError("shared_with_municipalities must be a list")
            return []

    if not isinstance(municipality_ids, list):
        if strict:
            raise ValueError("shared_with_municipalities must be a list")
        return []

    if strict:
        validate_shared_municipalities(municipality_ids, raise_error=True)

    try:
        source_id = int(source_municipality_id) if source_municipality_id is not None else None
    except (TypeError, ValueError):
        source_id = None

    normalized = []
    seen = set()
    for municipality_id in municipality_ids:
        try:
            municipality_id = int(municipality_id)
        except (TypeError, ValueError):
            if strict:
                raise ValueError(f"Invalid municipality ID: {municipality_id}")
            continue

        if not is_valid_zambales_municipality(municipality_id):
            if strict:
                raise ValueError(f"Municipality ID {municipality_id} is not within Zambales province")
            continue

        if source_id is not None and municipality_id == source_id:
            continue
        if municipality_id in seen:
            continue
        seen.add(municipality_id)
        normalized.append(municipality_id)

    return normalized


def get_announcement_municipality_audience_ids(announcement) -> list[int]:
    """Return normalized municipality audience for a municipality-scoped announcement."""
    scope = (getattr(announcement, 'scope', 'MUNICIPALITY') or 'MUNICIPALITY').upper()
    if scope != 'MUNICIPALITY':
        return []

    audience = []
    municipality_id = getattr(announcement, 'municipality_id', None)
    if municipality_id is not None and is_valid_zambales_municipality(municipality_id):
        audience.append(int(municipality_id))

    shared = normalize_shared_municipality_ids(
        municipality_id,
        getattr(announcement, 'shared_with_municipalities', None),
        strict=False,
    )
    for shared_id in shared:
        if shared_id not in audience:
            audience.append(shared_id)
    return audience


def announcement_targets_municipality(announcement, municipality_id) -> bool:
    """Return True when a municipality-scoped announcement targets the given municipality."""
    try:
        municipality_id = int(municipality_id)
    except (TypeError, ValueError):
        return False
    return municipality_id in get_announcement_municipality_audience_ids(announcement)


class Announcement(db.Model):
    """Announcement model for province/municipality/barangay communications."""

    __tablename__ = 'announcements'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    scope = db.Column(db.String(20), nullable=False, default='MUNICIPALITY')  # PROVINCE, MUNICIPALITY, BARANGAY
    municipality_id = db.Column(db.Integer, db.ForeignKey('municipalities.id'), nullable=True)
    barangay_id = db.Column(db.Integer, db.ForeignKey('barangays.id'), nullable=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_by_staff_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    priority = db.Column(db.String(20), nullable=False, default='medium')  # high, medium, low
    images = db.Column(db.JSON, nullable=True)
    external_url = db.Column(db.String(500), nullable=True)
    pinned = db.Column(db.Boolean, default=False, nullable=False)
    pinned_until = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), nullable=False, default='DRAFT')  # DRAFT, PUBLISHED, ARCHIVED
    publish_at = db.Column(db.DateTime, nullable=True)
    expire_at = db.Column(db.DateTime, nullable=True)
    shared_with_municipalities = db.Column(db.JSON, nullable=True)  # Active for MUNICIPALITY scope; stores additional target municipalities
    public_viewable = db.Column(db.Boolean, nullable=False, default=False)  # Deprecated compatibility flag; feed/detail visibility does not consult it
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)
    updated_at = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    # Relationships
    municipality = db.relationship('Municipality', backref='announcements')
    barangay = db.relationship('Barangay', backref='announcements')
    creator = db.relationship('User', foreign_keys=[created_by], backref='created_announcements')
    creator_staff = db.relationship('User', foreign_keys=[created_by_staff_id], backref='staff_created_announcements')

    # Indexes
    __table_args__ = (
        Index('idx_announcement_municipality', 'municipality_id'),
        Index('idx_announcement_barangay', 'barangay_id'),
        Index('idx_announcement_scope', 'scope'),
        Index('idx_announcement_status', 'status'),
        Index('idx_announcement_active', 'is_active'),
        Index('idx_announcement_priority', 'priority'),
        Index('idx_announcement_pinned', 'pinned'),
        Index('idx_announcement_publish', 'publish_at'),
        Index('idx_announcement_created', 'created_at'),
    )

    def __repr__(self):
        return f'<Announcement {self.title}>'

    def to_dict(self):
        """Convert announcement to dictionary with scoped metadata and compatibility fields."""
        now = utc_now()
        status_value = (self.status or 'DRAFT').upper()
        publish_at = _to_naive_utc(self.publish_at)
        expire_at = _to_naive_utc(self.expire_at)
        pinned_until = _to_naive_utc(self.pinned_until)
        created_at = _to_naive_utc(self.created_at)
        updated_at = _to_naive_utc(self.updated_at)

        within_window = (publish_at is None or publish_at <= now) and (expire_at is None or expire_at > now)
        is_published = status_value == 'PUBLISHED'
        is_active = bool(is_published and within_window)

        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'scope': self.scope,
            'municipality_id': self.municipality_id,
            'municipality_name': self.municipality.name if self.municipality else None,
            'barangay_id': self.barangay_id,
            'barangay_name': self.barangay.name if self.barangay else None,
            'created_by': self.created_by,
            'created_by_staff_id': self.created_by_staff_id or self.created_by,
            'creator_name': f"{self.creator.first_name} {self.creator.last_name}" if self.creator else None,
            'created_by_name': f"{self.creator.first_name} {self.creator.last_name}" if self.creator else None,
            'priority': self.priority,
            'images': self.images or [],
            'external_url': self.external_url,
            'pinned': bool(self.pinned),
            'pinned_until': pinned_until.isoformat() if pinned_until else None,
            'status': status_value,
            'publish_at': publish_at.isoformat() if publish_at else None,
            'expire_at': expire_at.isoformat() if expire_at else None,
            'shared_with_municipalities': self.shared_with_municipalities or [],
            'public_viewable': bool(self.public_viewable),
            'is_active': is_active,
            'created_at': created_at.isoformat() if created_at else None,
            'updated_at': updated_at.isoformat() if updated_at else None,
        }
