"""Public announcements routes."""
from flask import Blueprint, jsonify, request
from sqlalchemy import and_
from sqlalchemy.exc import OperationalError as SAOperationalError, ProgrammingError as SAProgrammingError
import sqlite3

try:
    from apps.api import db
    from apps.api.models.announcement import Announcement
except ImportError:
    from __init__ import db
    from models.announcement import Announcement


announcements_bp = Blueprint('announcements', __name__, url_prefix='/api/announcements')


@announcements_bp.route('', methods=['GET'])
def list_announcements():
    """List active announcements with municipality scoping.

    Query params:
      - municipality_id: int (REQUIRED for guests; authenticated users auto-scoped)
      - active: bool (default true)
      - page: int (default 1)
      - per_page: int (default 20)
    
    Municipality Scoping Rules:
      - Guest users: MUST provide municipality_id; returns empty if not provided
      - Logged-in users: Can browse other municipalities (discovery mode)
      - No global/unscoped data loads by default
    """
    from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
    
    try:
        municipality_id = request.args.get('municipality_id', type=int)
        active_param = request.args.get('active', 'true').lower()
        is_active = True if active_param in ['true', '1', 'yes'] else False if active_param in ['false', '0', 'no'] else True
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)

        # Check if user is authenticated
        is_authenticated = False
        user_municipality_id = None
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                is_authenticated = True
                # Get user's registered municipality for potential default scoping
                try:
                    from apps.api.models.user import User
                except ImportError:
                    from models.user import User
                user = User.query.get(user_id)
                if user:
                    user_municipality_id = user.municipality_id
        except Exception:
            pass

        # Municipality Scoping Enforcement:
        # - Guests without municipality_id get empty results (no global data)
        # - Logged-in users default to their municipality if no filter provided
        effective_municipality_id = municipality_id
        if not effective_municipality_id:
            if is_authenticated and user_municipality_id:
                # Default to user's registered municipality
                effective_municipality_id = user_municipality_id
            else:
                # Guest without location context: return empty per scoping rules
                return jsonify({
                    'announcements': [],
                    'count': 0,
                    'pagination': {
                        'page': page,
                        'per_page': per_page,
                        'total': 0,
                        'pages': 0,
                    },
                    'message': 'Please select a municipality to view announcements'
                }), 200

        # Build filters with enforced municipality scoping
        filters = [Announcement.municipality_id == effective_municipality_id]
        if is_active is not None:
            filters.append(Announcement.is_active == is_active)

        query = Announcement.query.filter(and_(*filters))
        query = query.order_by(Announcement.created_at.desc())
        paginated = query.paginate(page=page, per_page=per_page, error_out=False)

        return jsonify({
            'announcements': [a.to_dict() for a in paginated.items],
            'count': len(paginated.items),
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': paginated.total,
                'pages': paginated.pages,
            }
        }), 200

    except (sqlite3.OperationalError, SAOperationalError, SAProgrammingError):
        # Likely missing table in SQLite; return safe empty shape instead of 500
        # Re-parse paging so we can respond consistently
        page = max(1, request.args.get('page', 1, type=int) or 1)
        per_page = max(1, request.args.get('per_page', 20, type=int) or 20)
        return jsonify({
            'announcements': [],
            'count': 0,
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': 0,
                'pages': 0,
            }
        }), 200
    except Exception as e:
        return jsonify({'error': 'Failed to get announcements', 'details': str(e)}), 500


@announcements_bp.route('/<int:announcement_id>', methods=['GET'])
def get_announcement(announcement_id: int):
    """Get a single announcement by id."""
    try:
        ann = Announcement.query.get(announcement_id)
        if not ann or (ann.is_active is False):
            return jsonify({'error': 'Announcement not found'}), 404

        return jsonify(ann.to_dict()), 200

    except (sqlite3.OperationalError, SAOperationalError, SAProgrammingError):
        return jsonify({'error': 'Announcement not found'}), 404
    except Exception as e:
        return jsonify({'error': 'Failed to get announcement', 'details': str(e)}), 500


