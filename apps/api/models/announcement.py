"""MunLink Region 3 - Announcement Model
Database model for scoped announcements with municipality/barangay targeting.
"""
try:
    from apps.api import db
except ImportError:
    from __init__ import db
from datetime import datetime, timezone
from sqlalchemy import Index


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
    shared_with_municipalities = db.Column(db.JSON, nullable=True)  # Array of municipality IDs for cross-municipality sharing
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
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
        """Convert announcement to dictionary with scoped metadata."""
        now = datetime.now(timezone.utc)
        status_value = (self.status or 'DRAFT').upper()
        within_window = (self.publish_at is None or self.publish_at <= now) and (self.expire_at is None or self.expire_at > now)
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
            'pinned_until': self.pinned_until.isoformat() if self.pinned_until else None,
            'status': status_value,
            'publish_at': self.publish_at.isoformat() if self.publish_at else None,
            'expire_at': self.expire_at.isoformat() if self.expire_at else None,
            'shared_with_municipalities': self.shared_with_municipalities or [],
            'is_active': is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
