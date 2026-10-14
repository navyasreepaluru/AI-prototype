import pytest
import json
from backend.app import create_app
from backend.database import db
from backend.models import Scan, ThreatIndicator, CommunityReport

@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"
    with app.app_context():
        db.create_all()
        yield app.test_client()
        db.drop_all()

def test_health_check(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["database"] == "connected"

def test_scan_legitimate_url(client):
    res = client.post("/api/scan/url", json={"url": "https://www.google.com"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["risk_category"] == "Low"
    assert data["risk_score"] < 25.0
    assert "scan_id" in data
    assert data["canonical_hash"] is not None

def test_scan_phishing_url(client):
    res = client.post("/api/scan/url", json={
        "url": "http://185.220.101.4:8080/secure/paypal-login.xyz/auth"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["risk_category"] in ["High", "Critical"]
    assert data["risk_score"] >= 60.0
    assert len(data["findings"]) > 0
    # Must have IP and brand spoof findings
    indicators = [f["indicator"] for f in data["findings"]]
    assert any("IP Address" in ind for ind in indicators)
    assert any("Brand" in ind for ind in indicators)

def test_scan_message_scam(client):
    res = client.post("/api/scan/message", json={
        "message": "URGENT: Your SBI Bank account is suspended today! Share your OTP 48291 to verify and unblock immediately."
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["risk_category"] in ["High", "Critical"]
    assert len(data["highlight_spans"]) > 0
    assert len(data["findings"]) > 0

def test_scan_message_legitimate(client):
    res = client.post("/api/scan/message", json={
        "message": "Hi Mom, I will be reaching home by 7 PM today. Please keep dinner ready."
    })
    assert res.status_code == 200
    data = res.get_json()
    assert data["risk_category"] == "Low"
    assert data["risk_score"] <= 25.0

def test_url_anatomy(client):
    res = client.post("/api/url/anatomy", json={
        "url": "https://paypal.com.verify-security-center.xyz:8080/auth/login?session=123#step1"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "components" in data
    parsed = data["parsed_url"]
    assert parsed["subdomain"] == "paypal.com"
    assert parsed["registered_domain"] == "verify-security-center.xyz"
    assert parsed["port"] == 8080

def test_ssrf_safe_inspector_blocks_private_ip(client):
    # Attempt SSRF to internal loopback
    res = client.post("/api/url/inspect-safe", json={"url": "http://127.0.0.1:8000/admin"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["allowed"] is False
    assert "SSRF Protection Block" in data["reason"]

def test_ssrf_safe_inspector_blocks_metadata_ip(client):
    # Attempt SSRF to cloud metadata
    res = client.post("/api/url/inspect-safe", json={"url": "http://169.254.169.254/latest/meta-data/"})
    assert res.status_code == 200
    data = res.get_json()
    assert data["allowed"] is False
    assert "SSRF Protection Block" in data["reason"]

def test_community_report_submission_and_review(client):
    # Submit new report
    sub_res = client.post("/api/reports", json={
        "indicator": "http://sbi-alert-verify.buzz",
        "threat_category": "Phishing",
        "description": "Fake SMS requesting PAN update.",
        "reporter_tag": "SecurityTeam"
    })
    assert sub_res.status_code == 201
    rep_data = sub_res.get_json()
    rep_id = rep_data["report"]["id"]

    # Duplicate submission test -> should increment upvotes rather than create duplicate
    dup_res = client.post("/api/reports", json={
        "indicator": "http://sbi-alert-verify.buzz",
        "threat_category": "Phishing",
        "description": "Another report for the same site."
    })
    assert dup_res.status_code == 200
    assert dup_res.get_json()["is_duplicate"] is True

    # Review report -> Confirm
    patch_res = client.patch(f"/api/reports/{rep_id}/review", json={"status": "Confirmed"})
    assert patch_res.status_code == 200
    assert patch_res.get_json()["report"]["moderation_status"] == "Confirmed"

def test_model_info_endpoint(client):
    res = client.get("/api/model/info")
    assert res.status_code == 200
    data = res.get_json()
    assert "url_classifier" in data
    assert "message_classifier" in data
    assert data["url_classifier"]["metrics"]["accuracy"] > 0.9
