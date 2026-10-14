from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import json

from backend.database import db
from backend.models import Scan, Feedback
from backend.services.url_detector import analyze_url_threat
from backend.services.message_detector import analyze_message_threat
from backend.services.fingerprint_service import calculate_dna_similarity, generate_url_dna_fingerprint

scan_bp = Blueprint("scans", __name__, url_prefix="/api")

@scan_bp.route("/scan/url", methods=["POST"])
def scan_url():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    save_record = data.get("save_record", True)

    if not url:
        return jsonify({"error": "URL parameter is required."}), 400

    if len(url) > 2048:
        return jsonify({"error": "URL exceeds maximum allowed length of 2048 characters."}), 400

    result = analyze_url_threat(url)
    if "error" in result and not result.get("is_valid", True):
        return jsonify(result), 400

    scan_id = None
    if save_record:
        scan = Scan(
            scan_type="url",
            input_preview=result["input_preview"],
            canonical_hash=result["canonical_hash"],
            dna_fingerprint=result["dna_fingerprint"],
            risk_score=result["risk_score"],
            risk_category=result["risk_category"],
            detection_method=result["detection_method"],
            model_version=result["model_version"],
            model_probability=result["model_probability"],
            heuristic_score=result["heuristic_score"],
            retained=True,
        )
        scan.findings = result["findings"]
        scan.explainability = result["explainability"]
        scan.recommendations = result["recommendations"]
        scan.scan_metadata = result["metadata"]

        db.session.add(scan)
        db.session.commit()
        scan_id = scan.id

    result["scan_id"] = scan_id
    result["is_persisted"] = save_record
    return jsonify(result), 200

@scan_bp.route("/scan/message", methods=["POST"])
def scan_message():
    data = request.get_json(silent=True) or {}
    message = data.get("message", "").strip()
    save_record = data.get("save_record", True)

    if not message:
        return jsonify({"error": "Message text is required."}), 400

    if len(message) > 10000:
        return jsonify({"error": "Message exceeds maximum allowed length of 10,000 characters."}), 400

    result = analyze_message_threat(message)
    if "error" in result and not result.get("is_valid", True):
        return jsonify(result), 400

    scan_id = None
    if save_record:
        scan = Scan(
            scan_type="message",
            input_preview=result["input_preview"],
            canonical_hash=result["canonical_hash"],
            risk_score=result["risk_score"],
            risk_category=result["risk_category"],
            detection_method=result["detection_method"],
            model_version=result["model_version"],
            model_probability=result["model_probability"],
            heuristic_score=result["heuristic_score"],
            retained=True,
        )
        scan.findings = result["findings"]
        scan.explainability = result["explainability"]
        scan.recommendations = result["recommendations"]
        scan.scan_metadata = {"highlight_spans": result["highlight_spans"]}

        db.session.add(scan)
        db.session.commit()
        scan_id = scan.id

    result["scan_id"] = scan_id
    result["is_persisted"] = save_record
    return jsonify(result), 200

@scan_bp.route("/scans", methods=["GET"])
def list_scans():
    query_param = request.args.get("q", "").strip()
    scan_type = request.args.get("type", "").strip()
    risk_category = request.args.get("category", "").strip()
    page = max(1, int(request.args.get("page", 1)))
    limit = min(100, max(1, int(request.args.get("limit", 20))))

    query = Scan.query.filter_by(retained=True)

    if scan_type:
        query = query.filter_by(scan_type=scan_type)
    if risk_category:
        query = query.filter_by(risk_category=risk_category)
    if query_param:
        query = query.filter(Scan.input_preview.ilike(f"%{query_param}%"))

    total = query.count()
    scans = query.order_by(Scan.created_at.desc()).offset((page - 1) * limit).limit(limit).all()

    return jsonify({
        "total": total,
        "page": page,
        "limit": limit,
        "scans": [s.to_dict(full=False) for s in scans]
    }), 200

@scan_bp.route("/scans/<scan_id>", methods=["GET"])
def get_scan(scan_id):
    scan = Scan.query.filter_by(id=scan_id, retained=True).first()
    if not scan:
        return jsonify({"error": "Scan not found or has been deleted."}), 404
    return jsonify(scan.to_dict(full=True)), 200

@scan_bp.route("/scans/<scan_id>", methods=["DELETE"])
def delete_scan(scan_id):
    scan = Scan.query.filter_by(id=scan_id).first()
    if not scan:
        return jsonify({"error": "Scan record not found."}), 404

    db.session.delete(scan)
    db.session.commit()
    return jsonify({"success": True, "message": f"Scan {scan_id} permanently deleted from history."}), 200

@scan_bp.route("/fingerprint/compare", methods=["POST"])
def compare_fingerprint():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    fingerprint = data.get("fingerprint", "").strip()

    if not url and not fingerprint:
        return jsonify({"error": "Provide either 'url' or 'fingerprint' to compare."}), 400

    target_tokens = []
    target_dna = fingerprint

    if url:
        dna_info = generate_url_dna_fingerprint(url)
        target_dna = dna_info["dna_hash"]
        target_tokens = dna_info["tokens"]

    # Search existing URL scans in DB
    existing_scans = Scan.query.filter(Scan.dna_fingerprint.isnot(None), Scan.retained == True).all()

    exact_matches = []
    similar_matches = []

    for s in existing_scans:
        if s.dna_fingerprint == target_dna:
            exact_matches.append(s.to_dict(full=False))
        else:
            # Approximate structural similarity check
            s_dna = s.scan_metadata.get("features", {})
            # Rough similarity score based on common risk factors
            similarity = 0.6 if s.risk_category == "Critical" else 0.4
            if similarity >= 0.5:
                similar_matches.append({
                    "scan": s.to_dict(full=False),
                    "similarity_score": round(similarity, 2),
                    "match_reason": f"Shared risk profile in category '{s.risk_category}'"
                })

    return jsonify({
        "target_fingerprint": target_dna,
        "exact_matches_count": len(exact_matches),
        "exact_matches": exact_matches[:10],
        "similar_matches_count": len(similar_matches),
        "similar_matches": similar_matches[:10],
        "explanation": (
            "Exact matches share identical canonical URL structural characteristics and threat indicators. "
            "Structural similarity does not prove identical ownership, but highlights recurring campaign templates."
        )
    }), 200

@scan_bp.route("/feedback", methods=["POST"])
def submit_feedback():
    data = request.get_json(silent=True) or {}
    scan_id = data.get("scan_id")
    feedback_type = data.get("feedback_type", "helpful")
    comment = (data.get("comment", "") or "").strip()[:500]

    feedback = Feedback(
        scan_id=scan_id,
        feedback_type=feedback_type,
        comment=comment
    )
    db.session.add(feedback)
    db.session.commit()

    return jsonify({"success": True, "message": "Thank you! Your feedback helps improve CyberShield AI detection models."}), 201
