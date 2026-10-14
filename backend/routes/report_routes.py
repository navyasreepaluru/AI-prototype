import hashlib
import re
import html
from flask import Blueprint, request, jsonify
from datetime import datetime, timezone

from backend.database import db
from backend.models import CommunityReport, ThreatIndicator

report_bp = Blueprint("reports", __name__, url_prefix="/api")

VALID_CATEGORIES = {
    "Phishing", "Credential Harvesting", "Financial Fraud",
    "Malware Distribution", "Lottery Scam", "Social Engineering",
    "Impersonation", "Job / Investment Scam"
}

VALID_STATUSES = {"Pending", "Under Review", "Confirmed", "Rejected"}

def clean_input(text: str, max_len: int = 500) -> str:
    """Escapes HTML entities and trims whitespace to prevent stored XSS."""
    if not text:
        return ""
    safe = html.escape(text.strip())
    return safe[:max_len]

@report_bp.route("/reports", methods=["POST"])
def submit_report():
    data = request.get_json(silent=True) or {}
    indicator = (data.get("indicator", "") or "").strip()
    threat_category = data.get("threat_category", "Phishing").strip()
    description = (data.get("description", "") or "").strip()
    evidence_details = (data.get("evidence_details", "") or "").strip()
    reporter_tag = (data.get("reporter_tag", "") or "Anonymous Researcher").strip()

    if not indicator:
        return jsonify({"error": "Threat indicator (URL, domain, or message snippet) is required."}), 400

    if len(indicator) > 255:
        return jsonify({"error": "Indicator must be 255 characters or fewer."}), 400

    if threat_category not in VALID_CATEGORIES:
        threat_category = "Phishing"

    safe_indicator = clean_input(indicator, 255)
    safe_desc = clean_input(description, 500)
    safe_evidence = clean_input(evidence_details, 1000)
    safe_reporter = clean_input(reporter_tag, 60)

    # Compute duplicate group hash based on canonicalized indicator
    canonical_indicator = re.sub(r"^https?://", "", safe_indicator.lower()).strip("/")
    dup_hash = hashlib.sha256(canonical_indicator.encode("utf-8")).hexdigest()

    # Check for recent duplicate submission
    existing_dup = CommunityReport.query.filter_by(duplicate_group_hash=dup_hash).first()
    if existing_dup:
        existing_dup.upvotes += 1
        db.session.commit()
        return jsonify({
            "success": True,
            "is_duplicate": True,
            "message": f"Matching threat indicator already registered. Added your verification vote (Total confirmations: {existing_dup.upvotes}).",
            "report": existing_dup.to_dict()
        }), 200

    new_report = CommunityReport(
        indicator=safe_indicator,
        threat_category=threat_category,
        description=safe_desc or "Community flagged suspicious indicator.",
        evidence_details=safe_evidence,
        duplicate_group_hash=dup_hash,
        moderation_status="Pending",
        confidence_score=0.6,
        upvotes=1,
        reporter_tag=safe_reporter,
    )
    db.session.add(new_report)
    db.session.commit()

    return jsonify({
        "success": True,
        "is_duplicate": False,
        "message": "Threat report submitted to Community Radar for moderation review.",
        "report": new_report.to_dict()
    }), 201

@report_bp.route("/reports", methods=["GET"])
def list_reports():
    status = request.args.get("status", "").strip()
    category = request.args.get("category", "").strip()
    query_str = request.args.get("q", "").strip()
    page = max(1, int(request.args.get("page", 1)))
    limit = min(100, max(1, int(request.args.get("limit", 20))))

    query = CommunityReport.query

    if status and status in VALID_STATUSES:
        query = query.filter_by(moderation_status=status)
    if category and category in VALID_CATEGORIES:
        query = query.filter_by(threat_category=category)
    if query_str:
        query = query.filter(
            (CommunityReport.indicator.ilike(f"%{query_str}%")) |
            (CommunityReport.description.ilike(f"%{query_str}%"))
        )

    total = query.count()
    reports = query.order_by(CommunityReport.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "reports": [r.to_dict() for r in reports]
    }), 200

@report_bp.route("/reports/<int:report_id>/review", methods=["PATCH"])
def review_report(report_id):
    report = db.session.get(CommunityReport, report_id)
    if not report:
        return jsonify({"error": "Report not found."}), 404

    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").strip()

    if new_status not in VALID_STATUSES:
        return jsonify({"error": f"Invalid status. Must be one of: {', '.join(VALID_STATUSES)}"}), 400

    report.moderation_status = new_status
    if new_status == "Confirmed":
        report.confidence_score = 0.95

        # Check if already in ThreatIndicator to prevent duplicates
        existing_indicator = ThreatIndicator.query.filter_by(indicator_value=report.indicator.lower()).first()
        if not existing_indicator:
            ind_type = "url" if report.indicator.startswith(("http://", "https://", "www.")) else "scam_phrase"
            new_ind = ThreatIndicator(
                indicator_type=ind_type,
                indicator_value=report.indicator.lower(),
                threat_category=report.threat_category,
                source=f"Community Radar (Report #{report.id})",
                evidence=report.evidence_details or report.description,
                confidence_score=0.95,
                review_status="Verified"
            )
            db.session.add(new_ind)

    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Report #{report_id} status updated to '{new_status}'.",
        "report": report.to_dict()
    }), 200

@report_bp.route("/reports/<int:report_id>/upvote", methods=["POST"])
def upvote_report(report_id):
    report = db.session.get(CommunityReport, report_id)
    if not report:
        return jsonify({"error": "Report not found."}), 404

    report.upvotes += 1
    # Increase confidence slightly with each validation
    report.confidence_score = min(0.95, report.confidence_score + 0.05)
    db.session.commit()

    return jsonify({
        "success": True,
        "upvotes": report.upvotes,
        "confidence_score": round(report.confidence_score, 2)
    }), 200
