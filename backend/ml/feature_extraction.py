import math
import re
from urllib.parse import urlparse
import tldextract

SUSPICIOUS_TLDS = {
    "tk", "ml", "ga", "cf", "gq", "xyz", "top", "buzz", "icu", "club",
    "work", "date", "racing", "vip", "men", "win", "stream", "bid", "loan"
}

KNOWN_BRANDS = [
    "paypal", "bankofamerica", "wellsfargo", "chase", "citibank", "sbi",
    "hdfc", "icici", "axisbank", "paytm", "google", "microsoft", "apple",
    "amazon", "netflix", "facebook", "instagram", "whatsapp", "telegram",
    "binance", "coinbase", "metamask", "dropbox", "adobe"
]

SUSPICIOUS_KEYWORDS = [
    "login", "signin", "verify", "verification", "secure", "security",
    "account", "banking", "update", "confirm", "free", "bonus", "reward",
    "kyc", "wallet", "support", "service", "billing", "invoice", "refund",
    "password", "credential", "suspend", "unlock"
]

SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "goo.gl", "ow.ly", "is.gd", "buff.ly",
    "adf.ly", "t.co", "rebrand.ly", "cutt.ly"
}

def calculate_shannon_entropy(text: str) -> float:
    """Calculates Shannon entropy of a string to detect randomized/DGA strings."""
    if not text:
        return 0.0
    entropy = 0.0
    text_len = len(text)
    freq = {}
    for char in text:
        freq[char] = freq.get(char, 0) + 1
    for count in freq.values():
        p = count / text_len
        entropy -= p * math.log2(p)
    return entropy

def is_ip_address(hostname: str) -> bool:
    """Checks if hostname is an IPv4 address."""
    clean_host = hostname.split(":")[0].strip("[]")
    ipv4_pattern = r"^(\d{1,3}\.){3}\d{1,3}$"
    if re.match(ipv4_pattern, clean_host):
        parts = clean_host.split(".")
        return all(0 <= int(p) <= 255 for p in parts)
    return False

def extract_url_features(url_str: str) -> dict:
    """
    Extracts comprehensive lexical, structural, and statistical features
    from a URL for machine learning classification and explainability.
    """
    url_str = (url_str or "").strip()
    if not url_str.startswith(("http://", "https://")):
        url_str_parsed = "https://" + url_str
    else:
        url_str_parsed = url_str

    try:
        parsed = urlparse(url_str_parsed)
        hostname = (parsed.hostname or "").lower()
        path = parsed.path or ""
        query = parsed.query or ""
    except Exception:
        hostname = ""
        path = ""
        query = ""

    ext = tldextract.extract(url_str_parsed)
    subdomain = ext.subdomain.lower()
    domain = ext.domain.lower()
    suffix = ext.suffix.lower()
    registered_domain = f"{domain}.{suffix}" if suffix else domain

    subdomain_parts = [p for p in subdomain.split(".") if p]
    subdomain_count = len(subdomain_parts)

    url_length = len(url_str)
    hostname_length = len(hostname)
    path_length = len(path)
    query_length = len(query)

    dots_count = url_str.count(".")
    hyphens_count = url_str.count("-")
    underscores_count = url_str.count("_")
    at_count = url_str.count("@")
    double_slash_path = path.count("//")
    percent_count = url_str.count("%")
    digits_count = sum(c.isdigit() for c in url_str)
    digit_ratio = (digits_count / url_length) if url_length > 0 else 0.0

    is_ip = 1 if is_ip_address(hostname) else 0
    is_https = 1 if url_str.lower().startswith("https://") else 0
    is_shortener = 1 if registered_domain in SHORTENER_DOMAINS else 0
    has_suspicious_tld = 1 if suffix in SUSPICIOUS_TLDS else 0

    has_port = 1 if parsed.port and parsed.port not in [80, 443] else 0

    # Brand typosquatting / spoofing detection
    brand_mentions = []
    brand_in_subdomain = 0
    brand_in_path = 0
    brand_spoofed = 0

    for brand in KNOWN_BRANDS:
        if brand in hostname:
            brand_mentions.append(brand)
            if brand in subdomain:
                brand_in_subdomain = 1
            if domain != brand:
                brand_spoofed = 1
        if brand in path:
            brand_in_path = 1

    # Suspicious keywords count in URL
    kw_hits = [kw for kw in SUSPICIOUS_KEYWORDS if kw in url_str.lower()]
    keyword_count = len(kw_hits)

    hostname_entropy = calculate_shannon_entropy(hostname)
    path_entropy = calculate_shannon_entropy(path)

    features = {
        "url_length": float(url_length),
        "hostname_length": float(hostname_length),
        "path_length": float(path_length),
        "query_length": float(query_length),
        "subdomain_count": float(subdomain_count),
        "dots_count": float(dots_count),
        "hyphens_count": float(hyphens_count),
        "underscores_count": float(underscores_count),
        "at_count": float(at_count),
        "double_slash_path": float(double_slash_path),
        "percent_count": float(percent_count),
        "digit_ratio": float(digit_ratio),
        "is_ip": float(is_ip),
        "is_https": float(is_https),
        "is_shortener": float(is_shortener),
        "has_suspicious_tld": float(has_suspicious_tld),
        "has_unusual_port": float(has_port),
        "brand_spoofed": float(brand_spoofed),
        "brand_in_subdomain": float(brand_in_subdomain),
        "brand_in_path": float(brand_in_path),
        "keyword_count": float(keyword_count),
        "hostname_entropy": float(round(hostname_entropy, 4)),
        "path_entropy": float(round(path_entropy, 4)),
    }

    metadata = {
        "hostname": hostname,
        "subdomain": subdomain,
        "domain": domain,
        "suffix": suffix,
        "registered_domain": registered_domain,
        "path": path,
        "query": query,
        "port": parsed.port,
        "brand_mentions": brand_mentions,
        "keyword_hits": kw_hits,
        "is_ip": bool(is_ip),
        "is_shortener": bool(is_shortener),
        "has_suspicious_tld": bool(has_suspicious_tld),
    }

    return {"features": features, "metadata": metadata}

FEATURE_COLUMNS = [
    "url_length",
    "hostname_length",
    "path_length",
    "query_length",
    "subdomain_count",
    "dots_count",
    "hyphens_count",
    "underscores_count",
    "at_count",
    "double_slash_path",
    "percent_count",
    "digit_ratio",
    "is_ip",
    "is_https",
    "is_shortener",
    "has_suspicious_tld",
    "has_unusual_port",
    "brand_spoofed",
    "brand_in_subdomain",
    "brand_in_path",
    "keyword_count",
    "hostname_entropy",
    "path_entropy",
]
