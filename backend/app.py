import os
from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from backend.config import Config
from backend.database import db
from backend.routes.scan_routes import scan_bp
from backend.routes.threat_routes import threat_bp
from backend.routes.report_routes import report_bp
from backend.routes.anatomy_routes import anatomy_bp
from backend.routes.dashboard_routes import dashboard_bp
from backend.ml.model_manager import model_manager

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize CORS with explicit frontend origins
    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})

    # Initialize Database
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(scan_bp)
    app.register_blueprint(threat_bp)
    app.register_blueprint(report_bp)
    app.register_blueprint(anatomy_bp)
    app.register_blueprint(dashboard_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        db_healthy = True
        try:
            db.session.execute(db.text("SELECT 1"))
        except Exception:
            db_healthy = False

        return jsonify({
            "status": "healthy" if db_healthy else "degraded",
            "service": "CyberShield AI Backend Service",
            "version": "1.0.0",
            "database": "connected" if db_healthy else "disconnected",
            "url_model_loaded": model_manager.url_model is not None,
            "message_model_loaded": model_manager.message_pipeline is not None,
            "environment": os.getenv("FLASK_ENV", "development"),
        }), 200

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({"error": "Bad Request", "message": str(error)}), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Not Found", "message": "The requested API endpoint does not exist."}), 404

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({"error": "Payload Too Large", "message": "Request payload exceeds allowed security limit."}), 413

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({"error": "Internal Server Error", "message": "An unexpected server error occurred."}), 500

    @app.errorhandler(HTTPException)
    def handle_http_exception(e):
        return jsonify({"error": e.name, "message": e.description}), e.code

    with app.app_context():
        db.create_all()

    return app

app = create_app()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
