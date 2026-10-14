from flask import Blueprint, request, jsonify
from backend.services.url_anatomy import analyze_url_anatomy, ANATOMY_EXAMPLES
from backend.services.safe_inspector import safe_inspect_url

anatomy_bp = Blueprint("anatomy", __name__, url_prefix="/api")

@anatomy_bp.route("/url/anatomy", methods=["POST"])
def url_anatomy():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "URL parameter is required."}), 400

    if len(url) > 2048:
        return jsonify({"error": "URL exceeds maximum permitted length."}), 400

    result = analyze_url_anatomy(url)
    return jsonify(result), 200

@anatomy_bp.route("/url/anatomy/examples", methods=["GET"])
def get_anatomy_examples():
    return jsonify({
        "examples": ANATOMY_EXAMPLES
    }), 200

@anatomy_bp.route("/url/inspect-safe", methods=["POST"])
def inspect_url_safely():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "URL parameter is required."}), 400

    inspection_result = safe_inspect_url(url)
    return jsonify(inspection_result), 200
