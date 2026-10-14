import os
import requests
from datetime import datetime, timezone
from backend.config import Config
from backend.database import db
from backend.models import ThreatIndicator, CommunityReport

def check_local_threat_intelligence(url_or_domain: str) -> dict:
    """
    Checks internal local threat intelligence database and confirmed community reports.
    Returns matched records, confidence levels, and provenance.
    """
    clean_target = (url_or_domain or "").strip().lower()
    matches = []

    # Query local ThreatIndicator records
    indicators = ThreatIndicator.query.all()
    for ind in indicators:
        val = ind.indicator_value.lower()
        if val in clean_target or clean_target in val:
            matches.append({
                "type": "Local Threat Feed",
                "indicator": ind.indicator_value,
                "category": ind.threat_category,
                "evidence": ind.evidence,
                "source": ind.source,
                "confidence": ind.confidence_score,
                "status": ind.review_status,
                "last_updated": ind.last_updated.isoformat(),
            })

    # Query confirmed CommunityReports
    confirmed_reports = CommunityReport.query.filter_by(moderation_status="Confirmed").all()
    for rep in confirmed_reports:
        rep_val = rep.indicator.lower()
        if rep_val in clean_target or clean_target in rep_val:
            matches.append({
                "type": "Community Verified Intelligence",
                "indicator": rep.indicator,
                "category": rep.threat_category,
                "evidence": rep.evidence_details or rep.description,
                "source": f"Community Consensus ({rep.upvotes} validations)",
                "confidence": rep.confidence_score,
                "status": "Confirmed Threat",
                "last_updated": rep.created_at.isoformat(),
            })

    return {
        "found": len(matches) > 0,
        "match_count": len(matches),
        "matches": matches,
        "source": "Local Threat Database & Community Moderation Hub",
    }

def check_external_threat_reputation(url: str) -> dict:
    """
    Optional external reputation adapter.
    If GOOGLE_SAFE_BROWSING_API_KEY is configured in backend environment variables,
    it queries the v4 API safely with strict timeouts.
    Otherwise, returns a clearly labeled disabled status without fabricating data.
    """
    api_key = Config.GOOGLE_SAFE_BROWSING_API_KEY
    if not api_key:
        return {
            "status": "not_configured",
            "message": "External Google Safe Browsing API key not configured in environment. Operating in autonomous local intelligence mode.",
            "is_threat": False,
            "provider": "Google Safe Browsing v4 (Optional)",
            "threat_types": [],
        }

    try:
        endpoint = f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}"
        payload = {
            "client": {
                "clientId": "cybershield-ai",
                "clientVersion": "1.0.0"
            },
            "threatInfo": {
                "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                "platformTypes": ["ANY_PLATFORM"],
                "threatEntryTypes": ["URL"],
                "threatEntries": [{"url": url}]
            }
        }
        res = requests.post(endpoint, json=payload, timeout=3.0)
        if res.status_code == 200:
            data = res.json()
            matches = data.get("matches", [])
            threat_types = [m.get("threatType") for m in matches]
            return {
                "status": "active",
                "message": "External reputation check completed.",
                "is_threat": len(matches) > 0,
                "provider": "Google Safe Browsing v4",
                "threat_types": threat_types,
                "checked_at": datetime.now(timezone.utc).isoformat(),
            }
        else:
            return {
                "status": "error",
                "message": f"External provider returned HTTP {res.status_code}.",
                "is_threat": False,
                "provider": "Google Safe Browsing v4",
                "threat_types": [],
            }
    except Exception as e:
        return {
            "status": "timeout_or_error",
            "message": f"External threat check error: {str(e)}",
            "is_threat": False,
            "provider": "Google Safe Browsing v4",
            "threat_types": [],
        }
