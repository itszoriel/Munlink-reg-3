"""Province routes for Region 3."""
from flask import Blueprint, jsonify, request
from apps.api.models.province import Province
from apps.api.models.municipality import Municipality
from apps.api import db

provinces_bp = Blueprint('provinces', __name__, url_prefix='/api/provinces')


@provinces_bp.route('', methods=['GET'])
def list_provinces():
    """Get list of all provinces in Region 3."""
    try:
        provinces = Province.query.filter_by(is_active=True).all()
        
        include_municipalities = request.args.get('include_municipalities', 'false').lower() == 'true'
        
        return jsonify({
            'count': len(provinces),
            'provinces': [p.to_dict(include_municipalities=include_municipalities) for p in provinces]
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to get provinces', 'details': str(e)}), 500


@provinces_bp.route('/<int:province_id>', methods=['GET'])
def get_province(province_id):
    """Get details of a specific province."""
    try:
        province = Province.query.get(province_id)
        
        if not province:
            return jsonify({'error': 'Province not found'}), 404
        
        include_municipalities = request.args.get('include_municipalities', 'false').lower() == 'true'
        
        return jsonify(province.to_dict(include_municipalities=include_municipalities)), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to get province', 'details': str(e)}), 500


@provinces_bp.route('/slug/<slug>', methods=['GET'])
def get_province_by_slug(slug):
    """Get province by slug."""
    try:
        province = Province.query.filter_by(slug=slug).first()
        
        if not province:
            return jsonify({'error': 'Province not found'}), 404
        
        include_municipalities = request.args.get('include_municipalities', 'false').lower() == 'true'
        
        return jsonify(province.to_dict(include_municipalities=include_municipalities)), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to get province', 'details': str(e)}), 500


@provinces_bp.route('/<int:province_id>/municipalities', methods=['GET'])
def list_province_municipalities(province_id):
    """Get list of municipalities in a province."""
    try:
        province = Province.query.get(province_id)
        
        if not province:
            return jsonify({'error': 'Province not found'}), 404
        
        municipalities = Municipality.query.filter_by(
            province_id=province_id,
            is_active=True
        ).all()
        
        include_barangays = request.args.get('include_barangays', 'false').lower() == 'true'
        
        return jsonify({
            'province': province.name,
            'count': len(municipalities),
            'municipalities': [m.to_dict(include_barangays=include_barangays, include_province=False) for m in municipalities]
        }), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to get municipalities', 'details': str(e)}), 500






