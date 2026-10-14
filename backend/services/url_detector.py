import hashlib
import re
from urllib.parse import urlparse
from datetime import datetime, timezone

from backend.ml.model_manager import model_manager
from backend.ml.feature_extraction import (
    extract_url_features, is_ip_address, SUSPICIOUS_TLDS, KNOWN_BRANDS,
    SUSPICIOUS_KEYWORDS, SHORTENER_DOMAINS
)
from backend.services.fingerprint_service import generate_url_dna_fingerprint
from backend.services.threat_intel import check_local_threat_intelligence, check_external_threat_reputation

def sanitize_url_preview(url: str) -> str:
    """Sanitizes URL for privacy-conscious storage and display by masking sensitive query params."""
    if not url:
        return ""
    try:
        parsed = urlparse(url)
        # Mask sensitive query params
        if parsed.query:
            params = parsed.query.split("&")
            safe_params = []
            for p in params:
                if "=" in p:
                    k, v = p.split("=", 1)
                    if any(s in k.lower() for s in ["token", "key", "pass", "pwd", "auth", "secret", "cvv", "otp", "code"]):
                        safe_params.append(f"{k}=[REDACTED]")
                    elif len(v) > 30:
                        safe_params.append(f"{k}={v[:6]}...[TRUNCATED]")
                    else:
                        safe_params.append(p)
                else:
                    safe_params.append(p)
            safe_query = "&".join(safe_params)
            return parsed._replace(query=safe_query).geturl()
        return url
    except Exception:
        return url[:120]

def analyze_url_threat(url: str) -> dict:
    """
    Main URL threat detection pipeline.
    Combines:
    1. ML Model (Random Forest trained on lexical/structural features)
    2. Rule-Based Heuristic Engine (Explainable triggers & weights)
    3. Local Threat Intelligence database
    4. Optional External Feed
    5. Scam DNA Fingerprint Generation
    """
    clean_url = (url or "").strip()
    if not clean_url:
        return {
            "error": "URL cannot be empty",
            "is_valid": False
        }

    # Canonical representation for hash
    canonical_hash = hashlib.sha256(clean_url.lower().encode("utf-8")).hexdigest()
    input_preview = sanitize_url_preview(clean_url)

    # 1. Feature Extraction & Machine Learning Prediction
    ml_result = model_manager.predict_url(clean_url)
    ml_prob = ml_result["probability"]
    features = ml_result["features"]
    meta = ml_result["metadata"]
    model_used = ml_result["model_used"]

    # 2. Rule Engine & Explainability Findings
    findings = []
    detected_vectors = []
    heuristic_points = 0.0

    # Rule 1: IP Address Hostname
    if meta["is_ip"]:
        pts = 40.0
        heuristic_points += pts
        detected_vectors.append("ip_hostname")
        findings.append({
            "rule_id": "RULE_IP_HOSTNAME",
            "indicator": "Host is an IP Address",
            "severity": "Critical",
            "weight": pts,
            "component": "Hostname",
            "evidence": f"Target hostname '{meta['hostname']}' uses a raw IP address instead of a domain name.",
            "explanation": "Legitimate organizations register verified domains. Threat actors frequently host phishing kits and malware droppers directly on temporary cloud or bulletproof IPs.",
            "verification_advice": "Do not enter any personal details. Official services consistently operate on branded registered domains."
        })

    # Rule 2: Brand Spoofing / Typosquatting in Subdomain, Domain or Path
    if features["brand_spoofed"] or features["brand_in_path"]:
        pts = 35.0
        heuristic_points += pts
        detected_vectors.append("brand_spoofing")
        brand = meta["brand_mentions"][0] if meta["brand_mentions"] else (
            [b for b in KNOWN_BRANDS if b in clean_url.lower()][0] if any(b in clean_url.lower() for b in KNOWN_BRANDS) else "brand"
        )
        findings.append({
            "rule_id": "RULE_BRAND_SPOOF",
            "indicator": f"Brand Impersonation ({brand.title()})",
            "severity": "Critical",
            "weight": pts,
            "component": "Domain / Path",
            "evidence": f"URL references recognizable brand '{brand}' outside of verified brand domains.",
            "explanation": f"Deceptive technique where attackers leverage recognizable brand names (e.g. '{brand}') in hostnames or paths to mislead victims.",
            "verification_advice": f"Verify the exact official web address for {brand.title()}. Navigate directly through your browser address bar."
        })

    # Rule 3: High-Risk TLD
    if meta["has_suspicious_tld"]:
        pts = 20.0
        heuristic_points += pts
        detected_vectors.append("suspicious_tld")
        findings.append({
            "rule_id": "RULE_SUSPICIOUS_TLD",
            "indicator": f"High-Abuse Top-Level Domain (.{meta['suffix']})",
            "severity": "High",
            "weight": pts,
            "component": "TLD Suffix",
            "evidence": f"Registered domain uses '.{meta['suffix']}' suffix.",
            "explanation": "Certain free or ultra-low-cost TLDs correlate with high volumes of automated spam and phishing campaigns due to lenient registrar verification.",
            "verification_advice": "Exercise caution. Reputable consumer financial and enterprise services rarely use high-abuse disposable TLDs."
        })

    # Rule 4: High Shannon Entropy (Randomized Hostname / DGA)
    if features["hostname_entropy"] > 3.6:
        pts = 18.0
        heuristic_points += pts
        detected_vectors.append("high_entropy_dga")
        findings.append({
            "rule_id": "RULE_HIGH_ENTROPY",
            "indicator": "Algorithmic / High-Entropy Hostname",
            "severity": "High",
            "weight": pts,
            "component": "Hostname",
            "evidence": f"Hostname entropy is {features['hostname_entropy']} (expected threshold <= 3.5).",
            "explanation": "High randomness often signals a Domain Generation Algorithm (DGA) used by botnets and fast-flux phishing campaigns.",
            "verification_advice": "Search the domain name in public search engines to confirm if it belongs to a known reputable provider."
        })

    # Rule 5: Non-standard Web Port
    if features["has_unusual_port"]:
        pts = 15.0
        heuristic_points += pts
        detected_vectors.append("unusual_port")
        findings.append({
            "rule_id": "RULE_UNUSUAL_PORT",
            "indicator": f"Unusual Service Port ({meta['port']})",
            "severity": "Medium",
            "weight": pts,
            "component": "Port",
            "evidence": f"URL directs connection to non-standard port {meta['port']}.",
            "explanation": "Standard web traffic utilizes ports 80 (HTTP) or 443 (HTTPS). Alternative ports may be proxies or unvetted hosts.",
            "verification_advice": "Check whether the service operator officially requires this port."
        })

    # Rule 6: Excessive Subdomains / Deep Nesting
    if features["subdomain_count"] >= 3:
        pts = 12.0
        heuristic_points += pts
        detected_vectors.append("deep_subdomains")
        findings.append({
            "rule_id": "RULE_EXCESSIVE_SUBDOMAINS",
            "indicator": "Deep Subdomain Nesting",
            "severity": "Medium",
            "weight": pts,
            "component": "Subdomain",
            "evidence": f"URL contains {int(features['subdomain_count'])} subdomain tiers: '{meta['subdomain']}'.",
            "explanation": "Attackers chain multiple subdomains to push the true registered domain out of view on mobile screens.",
            "verification_advice": "Inspect the rightmost part of the hostname before the first slash to identify the genuine host."
        })

    # Rule 7: At-symbol (@) in URL (HTTP Basic Auth Spoofing)
    if features["at_count"] > 0:
        pts = 25.0
        heuristic_points += pts
        detected_vectors.append("auth_delimiter_spoof")
        findings.append({
            "rule_id": "RULE_AT_SYMBOL_SPOOF",
            "indicator": "Authentication Delimiter Spoofing ('@')",
            "severity": "High",
            "weight": pts,
            "component": "Authority",
            "evidence": "URL contains an '@' character.",
            "explanation": "Browsers interpret everything before '@' as username/credentials, redirecting the user to the host after the '@'.",
            "verification_advice": "Do not follow links containing '@' symbols in the web address."
        })

    # Rule 8: Suspicious Keywords in Path/Query
    if features["keyword_count"] >= 2:
        pts = 12.0
        heuristic_points += pts
        detected_vectors.append("credential_keywords")
        findings.append({
            "rule_id": "RULE_CREDENTIAL_KEYWORDS",
            "indicator": "Sensitive Authentication Keywords",
            "severity": "Medium",
            "weight": pts,
            "component": "Path / Query",
            "evidence": f"Matches sensitive terms: {', '.join(meta['keyword_hits'])}.",
            "explanation": "Phishing sites frequently include authentication keywords in the URL path to trick victims into thinking they are on a verification page.",
            "verification_advice": "Ensure you are on the authentic portal before supplying credentials."
        })

    # Rule 9: URL Shortener Domain
    if meta["is_shortener"]:
        pts = 10.0
        heuristic_points += pts
        detected_vectors.append("url_shortener")
        findings.append({
            "rule_id": "RULE_URL_SHORTENER",
            "indicator": "URL Shortening Service",
            "severity": "Low",
            "weight": pts,
            "component": "Domain",
            "evidence": f"Registered domain '{meta['registered_domain']}' is a link shortening service.",
            "explanation": "Shortened links obscure the final landing destination, making it impossible to evaluate destination risk without resolution.",
            "verification_advice": "Use a link unshortener or preview service before opening unfamiliar short links."
        })

    # Rule 10: Insecure HTTP Protocol
    if not features["is_https"]:
        pts = 8.0
        heuristic_points += pts
        detected_vectors.append("insecure_http")
        findings.append({
            "rule_id": "RULE_INSECURE_HTTP",
            "indicator": "Unencrypted HTTP Connection",
            "severity": "Low",
            "weight": pts,
            "component": "Scheme",
            "evidence": "URL uses unencrypted 'http://' rather than 'https://'.",
            "explanation": "Data submitted over unencrypted HTTP can be intercepted or altered by unauthorized intermediaries.",
            "verification_advice": "Never submit passwords or payment cards over unencrypted connections."
        })

    # 3. Check Local Threat Intelligence
    local_intel = check_local_threat_intelligence(clean_url)
    if local_intel["found"]:
        pts = 45.0
        heuristic_points += pts
        detected_vectors.append("threat_intel_match")
        for match in local_intel["matches"][:2]:
            findings.append({
                "rule_id": "RULE_LOCAL_INTEL_MATCH",
                "indicator": f"Flagged in Threat Intelligence ({match['category']})",
                "severity": "Critical",
                "weight": pts,
                "component": "Database Match",
                "evidence": f"Source: {match['source']} (Status: {match['status']}). Evidence: {match['evidence']}",
                "explanation": f"Indicator is documented in the threat database as associated with {match['category']}.",
                "verification_advice": "Block immediately. Do not access or interact with this resource."
            })

    # 4. Check External Reputation Adapter (if configured)
    external_intel = check_external_threat_reputation(clean_url)
    if external_intel.get("is_threat"):
        pts = 40.0
        heuristic_points += pts
        detected_vectors.append("external_feed_match")
        findings.append({
            "rule_id": "RULE_EXTERNAL_INTEL_MATCH",
            "indicator": "External Threat Reputation Alert",
            "severity": "Critical",
            "weight": pts,
            "component": "External Feed",
            "evidence": f"Provider: {external_intel['provider']}. Threats: {', '.join(external_intel['threat_types'])}",
            "explanation": "External threat feed flagged this URL as an active threat.",
            "verification_advice": "This link is recognized globally as malicious. Avoid visiting."
        })

    # 5. Hybrid Scoring Formulation
    # Heuristic score capped at 100
    heuristic_score = min(heuristic_points, 100.0)
    
    # Combined calibrated score: 45% ML probability (scaled 0-100) + 55% Heuristic Engine
    # If ML probability is very high (> 0.85) or Critical findings exist, floor at high score
    ml_scaled = ml_prob * 100.0
    
    if any(f["severity"] == "Critical" for f in findings):
        risk_score = max(heuristic_score, 82.0, (0.4 * ml_scaled + 0.6 * heuristic_score))
    elif any(f["severity"] == "High" for f in findings):
        risk_score = max(heuristic_score, 58.0, (0.45 * ml_scaled + 0.55 * heuristic_score))
    elif findings:
        risk_score = min(100.0, (0.45 * ml_scaled + 0.55 * heuristic_score))
    else:
        # No triggers and low ML probability
        risk_score = min(20.0, ml_scaled)

    risk_score = round(min(max(risk_score, 0.0), 100.0), 1)

    # Risk Category Mapping
    if risk_score >= 80.0:
        risk_category = "Critical"
    elif risk_score >= 55.0:
        risk_category = "High"
    elif risk_score >= 25.0:
        risk_category = "Medium"
    else:
        risk_category = "Low"

    # If evidence is completely empty and domain is generic/unknown
    if not findings and risk_score < 15.0 and len(clean_url) < 10:
        risk_category = "Inconclusive"

    # 6. Generate Scam DNA Fingerprint
    dna = generate_url_dna_fingerprint(clean_url, detected_vectors)

    # 7. Actionable Recommendations
    recommendations = []
    if risk_category in ["Critical", "High"]:
        recommendations.append("DO NOT click or open this URL in your web browser.")
        recommendations.append("Never enter login credentials, passwords, or payment cards on this site.")
        recommendations.append("If you already provided an OTP or password, change your credentials immediately and contact your institution.")
        recommendations.append("Submit this link to the Community Threat Radar to protect fellow users.")
    elif risk_category == "Medium":
        recommendations.append("Inspect the exact registered domain name carefully before proceeding.")
        recommendations.append("Ensure you arrived at this URL via an official portal rather than an unsolicited email or SMS.")
        recommendations.append("Avoid providing sensitive personal data until domain authenticity is confirmed.")
    else:
        recommendations.append("This URL demonstrates standard characteristics consistent with legitimate web addresses.")
        recommendations.append("Always verify HTTPS encryption and stay vigilant for unexpected login prompts.")

    # 8. Explainability Package
    explainability = {
        "summary": f"Analyzed using {model_used} and transparent rule heuristics. {len(findings)} risk indicator(s) identified.",
        "ml_probability": round(ml_prob, 3),
        "heuristic_score": round(heuristic_score, 1),
        "combined_score": risk_score,
        "feature_contributions": [
            {"name": "Hostname Entropy", "value": features["hostname_entropy"], "impact": "High" if features["hostname_entropy"] > 3.6 else "Normal"},
            {"name": "Subdomain Depth", "value": int(features["subdomain_count"]), "impact": "Elevated" if features["subdomain_count"] >= 3 else "Normal"},
            {"name": "Brand Lookalike", "value": bool(features["brand_spoofed"]), "impact": "Critical" if features["brand_spoofed"] else "None"},
            {"name": "IP Hostname", "value": bool(meta["is_ip"]), "impact": "Critical" if meta["is_ip"] else "None"},
            {"name": "Suspicious TLD", "value": bool(meta["has_suspicious_tld"]), "impact": "High" if meta["has_suspicious_tld"] else "None"},
        ],
        "safe_verification_steps": [
            "Check the Registered Domain (not subdomains) in your browser address bar.",
            "Search for the company's official domain using Google, DuckDuckGo, or Bing.",
            "Verify with whois databases or domain age lookup tools if newly registered."
        ]
    }

    return {
        "url": clean_url,
        "input_preview": input_preview,
        "canonical_hash": canonical_hash,
        "risk_score": risk_score,
        "risk_category": risk_category,
        "detection_method": "Hybrid ML (Random Forest) + Heuristic Rule Engine",
        "model_version": "v1.0.0-rf",
        "model_probability": round(ml_prob, 3),
        "heuristic_score": round(heuristic_score, 1),
        "dna_fingerprint": dna["dna_hash"],
        "dna_details": dna,
        "findings": findings,
        "explainability": explainability,
        "recommendations": recommendations,
        "metadata": {
            "features": features,
            "anatomy": meta,
            "local_intel": local_intel,
            "external_intel": external_intel,
        },
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    }
