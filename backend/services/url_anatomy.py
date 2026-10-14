from urllib.parse import urlparse, parse_qs, unquote
import tldextract
import re

from backend.ml.feature_extraction import is_ip_address, SUSPICIOUS_TLDS, KNOWN_BRANDS, SUSPICIOUS_KEYWORDS

ANATOMY_EXAMPLES = [
    {
        "id": "lookalike-subdomain",
        "title": "Deceptive Brand Subdomain",
        "url": "https://paypal.com.verify-security-center.xyz/auth/login?session_id=8921#confirm",
        "description": "Appears to be PayPal at first glance, but 'paypal.com' is actually an untrusted subdomain under registered domain 'verify-security-center.xyz'."
    },
    {
        "id": "ip-hostname",
        "title": "IP Address Based Hostname",
        "url": "http://185.220.101.4:8080/secure/sbi-netbanking/login.php",
        "description": "Legitimate organizations rarely host public websites directly on bare IP addresses or non-standard ports."
    },
    {
        "id": "typosquatting-hyphen",
        "title": "Hyphenated Typosquatting",
        "url": "https://www-bankofamerica-login-verification.top/update-card",
        "description": "Uses prominent brand name combined with hyphens on a high-risk suspicious top-level domain (.top)."
    },
    {
        "id": "suspicious-params",
        "title": "Credential Harvest Query Params",
        "url": "https://secure-portal-update.buzz/gateway?redirect=bank&user_token=secret_xyz&auth_prompt=true",
        "description": "Manipulates query parameters to mimic official authentication gateways and redirect targets."
    },
    {
        "id": "url-encoded-deception",
        "title": "Obfuscated / Percent Encoded URL",
        "url": "https://login%2Epaypal%2Ecom@phish-gateway.cf/%77%65%62%73%63%72",
        "description": "Uses '@' symbol authentication spoofing and percent-encoded hex characters to evade naive text filters."
    }
]

def analyze_url_anatomy(url_str: str) -> dict:
    """
    Deconstructs a URL into its core anatomical components,
    identifies deceptive components, and provides educational context.
    """
    url_clean = (url_str or "").strip()
    if not url_clean.startswith(("http://", "https://")):
        url_clean = "https://" + url_clean

    parsed = urlparse(url_clean)
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc
    hostname = (parsed.hostname or "").lower()
    port = parsed.port
    path = parsed.path or "/"
    raw_query = parsed.query
    fragment = parsed.fragment

    ext = tldextract.extract(url_clean)
    subdomain = ext.subdomain.lower()
    domain = ext.domain.lower()
    suffix = ext.suffix.lower()
    registered_domain = f"{domain}.{suffix}" if suffix else domain

    # Parse query parameters safely
    parsed_query = {}
    if raw_query:
        try:
            for k, vals in parse_qs(raw_query, keep_blank_values=True).items():
                parsed_query[k] = vals if len(vals) > 1 else vals[0]
        except Exception:
            parsed_query = {"raw": raw_query}

    # Component evaluations
    components = []

    # 1. Scheme
    scheme_risk = "Low"
    scheme_note = "Valid HTTPS protocol. Note: HTTPS encrypts data in transit, but does NOT verify the site is trustworthy."
    if scheme == "http":
        scheme_risk = "Medium"
        scheme_note = "Unencrypted HTTP connection. Traffic can be intercepted or modified in transit."
    elif scheme not in ["http", "https"]:
        scheme_risk = "High"
        scheme_note = f"Unusual or unsupported scheme: '{scheme}'."
    
    components.append({
        "name": "Scheme / Protocol",
        "value": scheme + "://",
        "risk_level": scheme_risk,
        "explanation": scheme_note,
        "is_safe_indicator": scheme == "https"
    })

    # 2. Subdomain
    subdomain_risk = "Low"
    subdomain_note = "Standard or empty subdomain."
    if subdomain:
        # Check if subdomain spoofs a brand
        spoofed = [b for b in KNOWN_BRANDS if b in subdomain]
        if spoofed:
            subdomain_risk = "Critical"
            subdomain_note = f"Brand impersonation in subdomain: contains '{spoofed[0]}' while registered domain is '{registered_domain}'."
        elif len(subdomain.split(".")) >= 3:
            subdomain_risk = "High"
            subdomain_note = f"Excessive subdomain nesting ({len(subdomain.split('.'))} levels), commonly used in phishing kits to disguise destination."
        elif any(kw in subdomain for kw in ["secure", "login", "verify", "banking"]):
            subdomain_risk = "Medium"
            subdomain_note = "Security-related keywords used in subdomain."
    
    components.append({
        "name": "Subdomain",
        "value": subdomain if subdomain else "(None)",
        "risk_level": subdomain_risk,
        "explanation": subdomain_note,
        "is_safe_indicator": subdomain_risk == "Low"
    })

    # 3. Registered Domain
    domain_risk = "Low"
    domain_note = f"Primary registered domain is '{registered_domain}'."
    if is_ip_address(hostname):
        domain_risk = "Critical"
        domain_note = f"Raw IP address used as hostname ({hostname}) instead of a registered domain name."
    elif suffix in SUSPICIOUS_TLDS:
        domain_risk = "High"
        domain_note = f"Top-Level Domain (.{suffix}) has high historical scam and abuse prevalence."
    elif any(b in domain and domain != b for b in KNOWN_BRANDS):
        domain_risk = "High"
        domain_note = f"Domain '{domain}' appears to be a brand lookalike or typosquat variation."
    
    components.append({
        "name": "Registered Domain",
        "value": registered_domain,
        "risk_level": domain_risk,
        "explanation": domain_note,
        "is_safe_indicator": domain_risk == "Low"
    })

    # 4. Port
    port_risk = "Low"
    port_val = str(port) if port else ("443 (default HTTPS)" if scheme == "https" else "80 (default HTTP)")
    port_note = "Standard web port."
    if port and port not in [80, 443]:
        port_risk = "High"
        port_note = f"Non-standard web port ({port}). Legitimate consumer services almost never use unconventional ports."
    
    components.append({
        "name": "Port",
        "value": port_val,
        "risk_level": port_risk,
        "explanation": port_note,
        "is_safe_indicator": port_risk == "Low"
    })

    # 5. Path
    path_risk = "Low"
    path_note = "Standard resource path."
    if path:
        if "//" in path:
            path_risk = "Medium"
            path_note = "Path contains consecutive slashes ('//'), which may indicate an open redirect bypass."
        if any(kw in path.lower() for kw in ["login.php", "signin", "verify", "webscr", "wallet", "kyc"]):
            path_risk = "Medium"
            path_note = "Path targets sensitive authentication or payment actions."
        if "%" in path:
            path_risk = "Medium"
            path_note = "Path contains percent-encoded characters, potentially concealing malicious strings."
    
    components.append({
        "name": "Path",
        "value": path,
        "risk_level": path_risk,
        "explanation": path_note,
        "is_safe_indicator": path_risk == "Low"
    })

    # 6. Query Parameters
    query_risk = "Low"
    query_note = "Standard query parameters." if parsed_query else "No query parameters."
    if parsed_query:
        sensitive_keys = [k for k in parsed_query.keys() if any(s in k.lower() for s in ["token", "auth", "redirect", "url", "next", "session", "key", "password"])]
        if sensitive_keys:
            query_risk = "Medium"
            query_note = f"Query contains sensitive or redirection parameters: {', '.join(sensitive_keys)}."
    
    components.append({
        "name": "Query Parameters",
        "value": parsed_query if parsed_query else "(None)",
        "risk_level": query_risk,
        "explanation": query_note,
        "is_safe_indicator": query_risk == "Low"
    })

    # 7. Fragment
    fragment_risk = "Low"
    fragment_note = "Client-side bookmark fragment." if fragment else "No fragment."
    components.append({
        "name": "Fragment",
        "value": "#" + fragment if fragment else "(None)",
        "risk_level": fragment_risk,
        "explanation": fragment_note,
        "is_safe_indicator": True
    })

    return {
        "url": url_str,
        "parsed_url": {
            "scheme": scheme,
            "hostname": hostname,
            "subdomain": subdomain,
            "domain": domain,
            "suffix": suffix,
            "registered_domain": registered_domain,
            "port": port,
            "path": path,
            "query": parsed_query,
            "fragment": fragment,
        },
        "components": components,
        "educational_takeaway": (
            "CyberShield Reminder: The green padlock or HTTPS icon only indicates an encrypted tunnel between you and the server. "
            "Over 80% of modern phishing websites utilize valid, free SSL certificates (e.g. Let's Encrypt). "
            "Always inspect the Registered Domain carefully to ensure you are communicating with the genuine service."
        )
    }
