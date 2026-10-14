from flask import Blueprint, request, jsonify
from backend.database import db
from backend.models import ThreatIndicator
from backend.config import Config

threat_bp = Blueprint("threats", __name__, url_prefix="/api")

@threat_bp.route("/threats", methods=["GET"])
def get_threat_indicators():
    indicator_type = request.args.get("type", "").strip()
    category = request.args.get("category", "").strip()
    query_str = request.args.get("q", "").strip()
    page = max(1, int(request.args.get("page", 1)))
    limit = min(100, max(1, int(request.args.get("limit", 20))))

    query = ThreatIndicator.query

    if indicator_type:
        query = query.filter_by(indicator_type=indicator_type)
    if category:
        query = query.filter_by(threat_category=category)
    if query_str:
        query = query.filter(
            (ThreatIndicator.indicator_value.ilike(f"%{query_str}%")) |
            (ThreatIndicator.evidence.ilike(f"%{query_str}%"))
        )

    total = query.count()
    items = query.order_by(ThreatIndicator.last_updated.desc()).offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "threats": [item.to_dict() for item in items],
        "intel_mode": "Local Threat Feed & Moderated Community Consensus",
        "external_adapter_status": "Active" if Config.GOOGLE_SAFE_BROWSING_API_KEY else "Disabled (Autonomous Local Mode)"
    }), 200

@threat_bp.route("/threats/summary", methods=["GET"])
def get_threats_summary():
    total_indicators = ThreatIndicator.query.count()
    categories = db.session.query(
        ThreatIndicator.threat_category,
        db.func.count(ThreatIndicator.id)
    ).group_by(ThreatIndicator.threat_category).all()

    types = db.session.query(
        ThreatIndicator.indicator_type,
        db.func.count(ThreatIndicator.id)
    ).group_by(ThreatIndicator.indicator_type).all()

    return jsonify({
        "total_indicators": total_indicators,
        "by_category": {cat: count for cat, count in categories},
        "by_type": {t: count for t, count in types},
        "intel_source": "Local CyberShield Intelligence Repository"
    }), 200
