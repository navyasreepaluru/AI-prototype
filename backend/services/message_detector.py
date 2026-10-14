import hashlib
import re
from datetime import datetime, timezone

from backend.ml.model_manager import model_manager

SCAM_PATTERNS = [
    {
        "id": "OTP_CREDENTIAL_THEFT",
        "indicator": "Credential / OTP Harvesting Attempt",
        "severity": "Critical",
        "weight": 40.0,
        "regex": r"(?:share\s+your\s+otp|send\s+(?:the\s+)?otp|enter\s+(?:your\s+)?(?:otp|cvv|pin|password|seed\s+phrase)|verify\s+(?:your\s+)?(?:password|pin)|provide\s+cvv|netbanking\s+password)",
        "explanation": "Demands high-risk authentication credentials (OTP, PIN, CVV, or password). Legitimate institutions explicitly state their employees will never ask for your OTP or password.",
        "category": "Credential Harvesting",
        "advice": "NEVER share an OTP, PIN, or password with anyone, regardless of who they claim to be."
    },
    {
        "id": "URGENT_SUSPENSION_THREAT",
        "indicator": "Urgent Suspension / Coercion Threat",
        "severity": "High",
        "weight": 30.0,
        "regex": r"(?:account\s+(?:is|will\s+be)\s+suspended|electricity\s+(?:will\s+be\s+disconnected|connection\s+cut)|sim\s+(?:card\s+)?(?:will\s+be\s+)?deactivated|wallet\s+will\s+be\s+forfeited|immediate\s+pay|within\s+\d+\s+hours|power\s+cut\s+tonight)",
        "explanation": "Manufactures artificial urgency and fear to provoke hasty compliance before you have time to verify the claim.",
        "category": "Social Engineering",
        "advice": "Take a breath. Legitimate utility providers and banks send written notices through official channels before service suspension."
    },
    {
        "id": "LOTTERY_PRIZE_REWARD",
        "indicator": "Fake Lottery / Prize / Reward Lure",
        "severity": "High",
        "weight": 30.0,
        "regex": r"(?:won\s+(?:rs|inr|\$|cash)|lucky\s+draw|kbc\s+crorepati|gift\s+card\s+worth|free\s+cashback|claim\s+reward|scratch\s*card\s+winner|giving\s+away\s+\d+\s+btc)",
        "explanation": "Promises large financial prizes or giveaways for contests you never entered, designed to extract advance processing fees or banking details.",
        "category": "Lottery / Advance-Fee Scam",
        "advice": "If you did not enter a lottery or sweepstake, you cannot win. Do not pay any 'registration' or 'tax' fee to claim prizes."
    },
    {
        "id": "OFFICIAL_IMPERSONATION",
        "indicator": "Institutional Impersonation",
        "severity": "High",
        "weight": 25.0,
        "regex": r"(?:sbi\s+bank|hdfc\s+alert|icici\s+card|income\s+tax\s+refund|customs\s+duty|fedex\s+parcel|police\s+cyber\s+crime|traffic\s+police\s+e-challan|binance\s+security|apple\s+id\s+locked)",
        "explanation": "Falsely claims authority from a government bureau, bank, courier, or major technology provider to gain instant credibility.",
        "category": "Impersonation",
        "advice": "Contact the organization directly using phone numbers printed on your physical bank card or official published website."
    },
    {
        "id": "EMBEDDED_SUSPICIOUS_LINK",
        "indicator": "Suspicious / Obfuscated Embedded Link",
        "severity": "Medium",
        "weight": 20.0,
        "regex": r"(?:https?://(?:bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|[\w\-]+(?:\.xyz|\.top|\.buzz|\.icu|\.tk|\.ml|\.cf|\.gq|\.men|\.club))[\w\d\-._~:/?#[\]@!$&'()*+,;=]*)",
        "explanation": "Contains a shortened link or a high-abuse domain designed to conceal the true destination of the landing page.",
        "category": "Phishing Link",
        "advice": "Do not tap on links received via SMS, WhatsApp, or unsolicited emails."
    },
    {
        "id": "WORK_FROM_HOME_TASK_FRAUD",
        "indicator": "Part-Time Job / Task Investment Fraud",
        "severity": "High",
        "weight": 28.0,
        "regex": r"(?:earn\s+(?:rs|inr|\$)\s*\d+.*daily|work\s+from\s+home.*telegram|like\s+youtube\s+videos|instant\s+upi\s+payment|quick\s+crorepati|double\s+your\s+crypto)",
        "explanation": "Promotes high-yield task schemes where victims are initially paid small amounts before being convinced to invest larger sums that cannot be withdrawn.",
        "category": "Task / Investment Fraud",
        "advice": "Legitimate employers never ask employees to pay upfront fees, recharge crypto, or communicate solely via anonymous Telegram handles."
    }
]

def sanitize_message_preview(text: str) -> str:
    """Sanitizes sensitive personal data (phone numbers, OTPs, emails) from message previews."""
    if not text:
        return ""
    sanitized = re.sub(r"\b\d{6}\b", "[OTP-REDACTED]", text)
    sanitized = re.sub(r"\b\d{10,12}\b", "[PHONE-REDACTED]", sanitized)
    sanitized = re.sub(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b", "[EMAIL-REDACTED]", sanitized)
    return sanitized[:200] + ("..." if len(sanitized) > 200 else "")

def analyze_message_threat(text: str) -> dict:
    """
    Analyzes message content using NLP model + Social Engineering Rule Engine.
    Identifies exact trigger spans, categorizes threat vectors, and computes explainability.
    """
    clean_text = (text or "").strip()
    if not clean_text:
        return {"error": "Message content cannot be empty", "is_valid": False}

    canonical_hash = hashlib.sha256(clean_text.lower().encode("utf-8")).hexdigest()
    input_preview = sanitize_message_preview(clean_text)

    # 1. NLP Model Inference
    ml_res = model_manager.predict_message(clean_text)
    nlp_prob = ml_res["probability"]
    model_used = ml_res["model_used"]

    # 2. Rule-Based Heuristic Pattern Matching
    findings = []
    highlight_spans = []
    heuristic_points = 0.0

    for rule in SCAM_PATTERNS:
        matches = list(re.finditer(rule["regex"], clean_text, re.IGNORECASE))
        if matches:
            pts = rule["weight"]
            heuristic_points += pts
            for m in matches:
                span_text = clean_text[m.start():m.end()]
                highlight_spans.append({
                    "phrase": span_text,
                    "start": m.start(),
                    "end": m.end(),
                    "severity": rule["severity"],
                    "indicator": rule["indicator"]
                })
            
            findings.append({
                "rule_id": rule["id"],
                "indicator": rule["indicator"],
                "severity": rule["severity"],
                "category": rule["category"],
                "weight": pts,
                "matched_phrases": [clean_text[m.start():m.end()] for m in matches[:3]],
                "explanation": rule["explanation"],
                "verification_advice": rule["advice"]
            })

    # 3. Hybrid Scoring
    heuristic_score = min(heuristic_points, 100.0)
    nlp_scaled = nlp_prob * 100.0

    if any(f["severity"] == "Critical" for f in findings):
        risk_score = max(heuristic_score, 85.0, (0.4 * nlp_scaled + 0.6 * heuristic_score))
    elif any(f["severity"] == "High" for f in findings):
        risk_score = max(heuristic_score, 60.0, (0.45 * nlp_scaled + 0.55 * heuristic_score))
    elif findings:
        risk_score = min(100.0, (0.45 * nlp_scaled + 0.55 * heuristic_score))
    else:
        # Zero findings: scale based on NLP probability with low baseline cap
        risk_score = min(18.0, nlp_prob * 30.0)

    risk_score = round(min(max(risk_score, 0.0), 100.0), 1)

    # Category Mapping
    if risk_score >= 80.0:
        risk_category = "Critical"
    elif risk_score >= 55.0:
        risk_category = "High"
    elif risk_score >= 30.0:
        risk_category = "Medium"
    else:
        risk_category = "Low"

    # Safety Recommendations
    recommendations = []
    if risk_category in ["Critical", "High"]:
        recommendations.append("DO NOT reply or contact any phone numbers/links provided in this message.")
        recommendations.append("Never disclose passwords, OTPs, UPI PINs, or bank account numbers.")
        recommendations.append("If financial loss occurred, call the National Cyber Crime Helpline at 1930 immediately or file an incident at cybercrime.gov.in.")
        recommendations.append("Block the sender and report the message as spam on your carrier or messaging app.")
    elif risk_category == "Medium":
        recommendations.append("Verify the message independently through official customer care numbers.")
        recommendations.append("Check your account balance or status directly in your official banking application.")
        recommendations.append("Be wary of any subsequent messages requesting urgent actions.")
    else:
        recommendations.append("No obvious scam or social engineering triggers were detected in this message.")
        recommendations.append("Continue to exercise caution when receiving unexpected messages with external links.")

    explainability = {
        "summary": f"Analyzed using {model_used} and social-engineering heuristic patterns. {len(findings)} indicator(s) identified.",
        "nlp_probability": round(nlp_prob, 3),
        "heuristic_score": round(heuristic_score, 1),
        "combined_score": risk_score,
        "indicators_count": len(findings),
        "key_risk_factors": [f["indicator"] for f in findings],
        "safe_verification_steps": [
            "Contact your bank or service provider through verified official contact numbers.",
            "In India, report cyber financial fraud to 1930 within the golden hour to freeze unauthorized transfers.",
            "Verify official communication through verified SMS sender headers (e.g., AD-HDFCBK, VK-SBIBNK)."
        ]
    }

    return {
        "input_preview": input_preview,
        "canonical_hash": canonical_hash,
        "risk_score": risk_score,
        "risk_category": risk_category,
        "detection_method": "Hybrid NLP (TF-IDF + Logistic Regression) + Social Engineering Heuristics",
        "model_version": "v1.0.0-nlp",
        "model_probability": round(nlp_prob, 3),
        "heuristic_score": round(heuristic_score, 1),
        "highlight_spans": highlight_spans,
        "findings": findings,
        "explainability": explainability,
        "recommendations": recommendations,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    }
