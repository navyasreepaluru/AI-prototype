import sys
import json
from pathlib import Path
from datetime import datetime, timedelta, timezone

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app import create_app
from backend.database import db
from backend.models import Scan, ThreatIndicator, CommunityReport, Feedback, ModelMetadata
from backend.services.url_detector import analyze_url_threat
from backend.services.message_detector import analyze_message_threat

def seed_database():
    app = create_app()
    with app.app_context():
        print("Initializing database tables...")
        db.create_all()

        # 1. Seed Model Metadata
        print("Seeding Model Metadata...")
        if not ModelMetadata.query.filter_by(model_name="URL Random Forest Classifier").first():
            url_meta = ModelMetadata(
                model_name="URL Random Forest Classifier",
                model_version="v1.0.0-rf",
                model_type="RandomForestClassifier",
                training_data_source="Curated Lexical & Structural Phishing/Benign Dataset",
                dataset_size=100,
                accuracy=0.9600,
                precision_score=1.0000,
                recall_score=0.9167,
                f1_score=0.9565,
                confusion_matrix_json=json.dumps([[13, 0], [1, 11]]),
                supported_input_types="HTTP/HTTPS URLs, Hostnames, IP URLs",
                feature_names_json=json.dumps([
                    "hostname_entropy", "hyphens_count", "hostname_length", "has_suspicious_tld",
                    "url_length", "subdomain_count", "brand_spoofed", "is_ip"
                ]),
                training_timestamp=datetime.now(timezone.utc),
                is_active=True
            )
            db.session.add(url_meta)

        if not ModelMetadata.query.filter_by(model_name="Scam NLP Classifier").first():
            nlp_meta = ModelMetadata(
                model_name="Scam NLP Classifier",
                model_version="v1.0.0-nlp",
                model_type="TF-IDF + LogisticRegression",
                training_data_source="Curated Social Engineering & Scam Message Dataset",
                dataset_size=40,
                accuracy=1.0000,
                precision_score=1.0000,
                recall_score=1.0000,
                f1_score=1.0000,
                confusion_matrix_json=json.dumps([[5, 0], [0, 5]]),
                supported_input_types="SMS, Email, WhatsApp, Social Media Messages",
                feature_names_json=json.dumps(["TF-IDF 1-2 N-grams", "Keyword weights"]),
                training_timestamp=datetime.now(timezone.utc),
                is_active=True
            )
            db.session.add(nlp_meta)

        # 2. Seed Threat Indicators
        print("Seeding Threat Indicators...")
        sample_threats = [
            ("url", "paypal-security-verification.xyz", "Phishing", "Security Feed", "High-entropy domain registered 48h ago spoofing PayPal auth flow.", 0.98),
            ("domain", "sbi-kyc-mandatory-update.buzz", "Credential Harvesting", "Local Intelligence", "Hosted phishing portal harvesting netbanking passwords and Pan details.", 0.95),
            ("ip", "185.220.101.4", "Malware Distribution", "Security Feed", "Bulletproof host serving malicious APK masquerading as WhatsApp Gold.", 0.92),
            ("domain", "bankofamerica-urgent-login.tk", "Credential Harvesting", "Community Verified", "Free .tk domain mimicking BoA retail signin.", 0.96),
            ("scam_phrase", "electricity connection will be disconnected tonight", "Financial Fraud", "Local Intelligence", "Widespread recurring SMS scam targeting Indian electricity utility customers.", 0.99),
            ("domain", "netflix-billing-suspended.icu", "Phishing", "Local Intelligence", "Impersonating Netflix renewal billing page.", 0.91),
            ("domain", "indiatimes-lottery-kbc.gq", "Lottery Scam", "Community Verified", "Advance-fee scam asking users to deposit Rs 12,500 tax before claiming prize.", 0.97),
            ("ip", "103.251.167.22", "Phishing", "Security Feed", "Active fake SBI phishing mirror.", 0.94),
        ]

        for ind_type, val, cat, src, evid, conf in sample_threats:
            if not ThreatIndicator.query.filter_by(indicator_value=val).first():
                ti = ThreatIndicator(
                    indicator_type=ind_type,
                    indicator_value=val,
                    threat_category=cat,
                    source=src,
                    evidence=evid,
                    confidence_score=conf,
                    review_status="Verified"
                )
                db.session.add(ti)

        # 3. Seed Community Reports
        print("Seeding Community Reports...")
        sample_reports = [
            ("https://sbi-card-reward-points.top/claim", "Financial Fraud", "Received SMS promising 8,500 SBI reward points expiring in 2 hours.", "Reported after SMS arrival on Airtel network.", "Confirmed", 0.95, 14, "Research Team"),
            ("http://fedex-unpaid-customs-duty.xyz/pay", "Phishing", "Demands Rs 1,499 via UPI for an overseas parcel I never ordered.", "SMS sent from unknown personal 10-digit mobile number.", "Confirmed", 0.92, 9, "User#7821"),
            ("https://income-tax-refund-2026.buzz/verify", "Impersonation", "Claims Income Tax refund of Rs 24,000 pending direct credit.", "Directs to a clone of the official Income Tax e-filing portal.", "Under Review", 0.80, 5, "AuditNode"),
            ("https://free-crypto-doubler-event.win", "Job / Investment Scam", "Promising double Ethereum return on live stream.", "YouTube comments spam bot link.", "Pending", 0.60, 2, "CryptoWatch"),
            ("https://legit-student-portal.college.edu", "Phishing", "False alarm report on internal college portal.", "Submitted erroneously by user.", "Rejected", 0.10, 1, "Reporter#02"),
        ]

        for ind, cat, desc, evid, stat, conf, upv, rep_tag in sample_reports:
            if not CommunityReport.query.filter_by(indicator=ind).first():
                cr = CommunityReport(
                    indicator=ind,
                    threat_category=cat,
                    description=desc,
                    evidence_details=evid,
                    duplicate_group_hash=f"seed_hash_{ind}",
                    moderation_status=stat,
                    confidence_score=conf,
                    upvotes=upv,
                    reporter_tag=rep_tag
                )
                db.session.add(cr)

        # 4. Seed Representative Scans across Past 7 Days
        print("Seeding Realistic Baseline Scans...")
        sample_scans_data = [
            # High / Critical Threats
            ("url", "http://paypal-security-verification-alert.xyz/auth/login", 5),
            ("url", "http://185.220.101.4:8080/secure/sbi-netbanking/login.php", 4),
            ("url", "https://sbi-kyc-mandatory-update.buzz/pan-card-link", 3),
            ("message", "URGENT: Your SBI Bank account is suspended today! Share your OTP 48291 to verify and unblock immediately.", 2),
            ("message", "Dear Customer, Your electricity connection will be disconnected tonight at 9:30 PM due to unpaid bill. Immediately pay on this link.", 1),
            ("message", "Congratulations! You have won Rs 25,00,000 cash in KBC Jio Lucky Draw! Call manager Ramesh at 9876543210 to claim.", 0),

            # Medium / Inconclusive Threats
            ("url", "https://bit.ly/3xFakeSuspiciousScamLink123", 4),
            ("url", "https://portal-update-auth-gateway.org/verify", 2),
            ("message", "Your package from overseas is held at customs. Please verify your address at link.", 1),

            # Low / Safe Scans
            ("url", "https://www.google.com", 6),
            ("url", "https://www.github.com/explore", 5),
            ("url", "https://en.wikipedia.org/wiki/Computer_security", 3),
            ("url", "https://www.coursera.org/learn/cyber-security", 2),
            ("url", "https://stackoverflow.com/questions", 1),
            ("message", "Your Swiggy order from Biryani House is out for delivery. Delivery partner is Rahul.", 3),
            ("message", "Meeting reminder: CyberShield Project Standup starts in 15 minutes on Google Meet.", 0),
        ]

        now = datetime.now(timezone.utc)
        for item_type, content, days_ago in sample_scans_data:
            if item_type == "url":
                res = analyze_url_threat(content)
            else:
                res = analyze_message_threat(content)

            scan_record = Scan(
                scan_type=item_type,
                input_preview=res["input_preview"],
                canonical_hash=res["canonical_hash"],
                dna_fingerprint=res.get("dna_fingerprint"),
                risk_score=res["risk_score"],
                risk_category=res["risk_category"],
                detection_method=res["detection_method"],
                model_version=res["model_version"],
                model_probability=res["model_probability"],
                heuristic_score=res["heuristic_score"],
                retained=True,
                created_at=now - timedelta(days=days_ago, hours=2, minutes=15)
            )
            scan_record.findings = res["findings"]
            scan_record.explainability = res["explainability"]
            scan_record.recommendations = res["recommendations"]
            scan_record.scan_metadata = res.get("metadata", {})
            db.session.add(scan_record)

        db.session.commit()
        print("Database Seeding Completed Successfully!")

if __name__ == "__main__":
    seed_database()
