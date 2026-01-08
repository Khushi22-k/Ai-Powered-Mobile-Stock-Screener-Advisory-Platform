from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from . import db
from .models import NotificationPreference, Notification, User

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    pref = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not pref:
        # Create default preferences if not exist
        pref = NotificationPreference(user_id=user_id)
        db.session.add(pref)
        db.session.commit()

    return jsonify({
        'price_alerts_enabled': pref.price_alerts_enabled,
        'ai_signal_alerts_enabled': pref.ai_signal_alerts_enabled,
        'risk_alerts_enabled': pref.risk_alerts_enabled,
        'price_upper_threshold': float(pref.price_upper_threshold) if pref.price_upper_threshold else '',
        'price_lower_threshold': float(pref.price_lower_threshold) if pref.price_lower_threshold else '',
        'ai_confidence_threshold': float(pref.ai_confidence_threshold),
        'cooldown_minutes': pref.cooldown_minutes
    })

@notifications_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()
    pref = NotificationPreference.query.filter_by(user_id=user_id).first()
    if not pref:
        pref = NotificationPreference(user_id=user_id)
        db.session.add(pref)

    pref.price_alerts_enabled = data.get('price_alerts_enabled', pref.price_alerts_enabled)
    pref.ai_signal_alerts_enabled = data.get('ai_signal_alerts_enabled', pref.ai_signal_alerts_enabled)
    pref.risk_alerts_enabled = data.get('risk_alerts_enabled', pref.risk_alerts_enabled)
    pref.price_upper_threshold = data.get('price_upper_threshold', pref.price_upper_threshold)
    pref.price_lower_threshold = data.get('price_lower_threshold', pref.price_lower_threshold)
    pref.ai_confidence_threshold = data.get('ai_confidence_threshold', pref.ai_confidence_threshold)
    pref.cooldown_minutes = data.get('cooldown_minutes', pref.cooldown_minutes)

    db.session.commit()
    return jsonify({"message": "Preferences updated successfully"})

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    limit = request.args.get('limit', 10, type=int)
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'

    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)

    notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

    unread_count = Notification.query.filter_by(user_id=user_id, is_read=False).count()

    return jsonify({
        'notifications': [{
            'id': n.id,
            'type': n.type,
            'title': n.title,
            'message': n.message,
            'symbol': n.symbol,
            'data': n.data,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat()
        } for n in notifications],
        'unread_count': unread_count
    })

@notifications_bp.route('/read/<int:notification_id>', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    user_id = get_jwt_identity()
    notification = Notification.query.filter_by(id=notification_id, user_id=user_id).first()

    if not notification:
        return jsonify({"error": "Notification not found"}), 404

    notification.is_read = True
    db.session.commit()

    return jsonify({"message": "Notification marked as read"})
