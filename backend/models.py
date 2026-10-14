import json
import uuid
from datetime import datetime, timezone
from backend.database import db

def utc_now():
    return datetime.now(timezone.utc)

class Scan(db.Model):
    __tablename__ = "scans"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_type = db.Column(db.String(20), nullable=False)  # 'url' or 'message'
    input_preview = db.Column(db.String(500), nullable=False)  # Privacy-conscious/redacted representation
    canonical_hash = db.Column(db.String(64), index=True, nullable=False)  # SHA-256 for duplicate lookup
    dna_fingerprint = db.Column(db.String(64), index=True, nullable=True)  # Scam DNA hash
    
    risk_score = db.Column(db.Float, nullable=False, default=0.0)  # 0 to 100
    risk_category = db.Column(db.String(20), nullable=False, default="Low")  # Low, Medium, High, Critical, Inconclusive
    detection_method = db.Column(db.String(100), nullable=False, default="Hybrid ML + Rule Engine")
    model_version = db.Column(db.String(50), nullable=False, default="v1.0.0")
    
    model_probability = db.Column(db.Float, nullable=True)
    heuristic_score = db.Column(db.Float, nullable=True)
    
    findings_json = db.Column(db.Text, nullable=False, default="[]")
    explainability_json = db.Column(db.Text, nullable=False, default="{}")
    recommendations_json = db.Column(db.Text, nullable=False, default="[]")
    metadata_json = db.Column(db.Text, nullable=True, default="{}")
    
    retained = db.Column(db.Boolean, default=True, nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    @property
    def findings(self):
        try:
            return json.loads(self.findings_json)
        except Exception:
            return []

    @findings.setter
    def findings(self, val):
        self.findings_json = json.dumps(val)

    @property
    def explainability(self):
        try:
            return json.loads(self.explainability_json)
        except Exception:
            return {}

    @explainability.setter
    def explainability(self, val):
        self.explainability_json = json.dumps(val)

    @property
    def recommendations(self):
        try:
            return json.loads(self.recommendations_json)
        except Exception:
            return []

    @recommendations.setter
    def recommendations(self, val):
        self.recommendations_json = json.dumps(val)

    @property
    def scan_metadata(self):
        try:
            return json.loads(self.metadata_json)
        except Exception:
            return {}

    @scan_metadata.setter
    def scan_metadata(self, val):
        self.metadata_json = json.dumps(val)

    def to_dict(self, full=True):
        data = {
            "id": self.id,
            "scan_type": self.scan_type,
            "input_preview": self.input_preview,
            "canonical_hash": self.canonical_hash,
            "dna_fingerprint": self.dna_fingerprint,
            "risk_score": round(self.risk_score, 1),
            "risk_category": self.risk_category,
            "detection_method": self.detection_method,
            "model_version": self.model_version,
            "model_probability": round(self.model_probability, 3) if self.model_probability is not None else None,
            "heuristic_score": round(self.heuristic_score, 1) if self.heuristic_score is not None else None,
            "created_at": self.created_at.isoformat(),
            "findings_count": len(self.findings),
        }
        if full:
            data["findings"] = self.findings
            data["explainability"] = self.explainability
            data["recommendations"] = self.recommendations
            data["metadata"] = self.scan_metadata
        return data


class ThreatIndicator(db.Model):
    __tablename__ = "threat_indicators"

    id = db.Column(db.Integer, primary_key=True)
    indicator_type = db.Column(db.String(50), nullable=False)  # url, domain, ip, scam_phrase, brand_spoof
    indicator_value = db.Column(db.String(255), index=True, nullable=False)
    threat_category = db.Column(db.String(100), nullable=False)
    source = db.Column(db.String(100), nullable=False, default="Local Intelligence")
    evidence = db.Column(db.Text, nullable=False)
    confidence_score = db.Column(db.Float, default=0.9, nullable=False)
    review_status = db.Column(db.String(50), default="Verified", nullable=False)
    first_seen = db.Column(db.DateTime, default=utc_now, nullable=False)
    last_updated = db.Column(db.DateTime, default=utc_now, onupdate=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "indicator_type": self.indicator_type,
            "indicator_value": self.indicator_value,
            "threat_category": self.threat_category,
            "source": self.source,
            "evidence": self.evidence,
            "confidence_score": round(self.confidence_score, 2),
            "review_status": self.review_status,
            "first_seen": self.first_seen.isoformat(),
            "last_updated": self.last_updated.isoformat(),
        }


class CommunityReport(db.Model):
    __tablename__ = "community_reports"

    id = db.Column(db.Integer, primary_key=True)
    indicator = db.Column(db.String(255), nullable=False)
    threat_category = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(500), nullable=False)
    evidence_details = db.Column(db.String(1000), nullable=True)
    duplicate_group_hash = db.Column(db.String(64), index=True, nullable=False)
    moderation_status = db.Column(db.String(50), default="Pending", nullable=False)  # Pending, Under Review, Confirmed, Rejected
    confidence_score = db.Column(db.Float, default=0.5, nullable=False)
    upvotes = db.Column(db.Integer, default=1, nullable=False)
    reporter_tag = db.Column(db.String(100), default="Anonymous Researcher", nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "indicator": self.indicator,
            "threat_category": self.threat_category,
            "description": self.description,
            "evidence_details": self.evidence_details,
            "duplicate_group_hash": self.duplicate_group_hash,
            "moderation_status": self.moderation_status,
            "confidence_score": round(self.confidence_score, 2),
            "upvotes": self.upvotes,
            "reporter_tag": self.reporter_tag,
            "created_at": self.created_at.isoformat(),
        }


class Feedback(db.Model):
    __tablename__ = "feedbacks"

    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.String(36), nullable=True)
    feedback_type = db.Column(db.String(50), nullable=False)  # accurate, false_positive, false_negative, helpful
    comment = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=utc_now, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "scan_id": self.scan_id,
            "feedback_type": self.feedback_type,
            "comment": self.comment,
            "created_at": self.created_at.isoformat(),
        }


class ModelMetadata(db.Model):
    __tablename__ = "model_metadata"

    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False)
    model_version = db.Column(db.String(50), nullable=False)
    model_type = db.Column(db.String(100), nullable=False)
    training_data_source = db.Column(db.String(255), nullable=False)
    dataset_size = db.Column(db.Integer, default=0, nullable=False)
    accuracy = db.Column(db.Float, default=0.0, nullable=False)
    precision_score = db.Column(db.Float, default=0.0, nullable=False)
    recall_score = db.Column(db.Float, default=0.0, nullable=False)
    f1_score = db.Column(db.Float, default=0.0, nullable=False)
    confusion_matrix_json = db.Column(db.Text, default="[[0, 0], [0, 0]]", nullable=False)
    supported_input_types = db.Column(db.String(255), default="urls, messages", nullable=False)
    feature_names_json = db.Column(db.Text, default="[]", nullable=False)
    training_timestamp = db.Column(db.DateTime, default=utc_now, nullable=False)
    is_active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "model_type": self.model_type,
            "training_data_source": self.training_data_source,
            "dataset_size": self.dataset_size,
            "accuracy": round(self.accuracy, 4),
            "precision_score": round(self.precision_score, 4),
            "recall_score": round(self.recall_score, 4),
            "f1_score": round(self.f1_score, 4),
            "confusion_matrix": json.loads(self.confusion_matrix_json),
            "supported_input_types": self.supported_input_types,
            "feature_names": json.loads(self.feature_names_json),
            "training_timestamp": self.training_timestamp.isoformat(),
            "is_active": self.is_active,
        }
