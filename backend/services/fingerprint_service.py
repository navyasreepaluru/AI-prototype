import hashlib
import json
import re
from urllib.parse import urlparse, parse_qs
import tldextract

def generate_url_dna_fingerprint(url: str, detected_vectors: list = None) -> dict:
    """
    Generates a privacy-conscious Scam DNA Fingerprint.
    Extracts structural components, normalizes them, and produces:
    - Deterministic canonical structural hash (DNA Hash)
    - Normalized DNA profile string (transparent and human-readable)
    - Vector tokens for similarity comparison
    """
    url_clean = (url or "").strip()
    if not url_clean.startswith(("http://", "https://")):
        url_clean = "https://" + url_clean

    parsed = urlparse(url_clean)
    scheme = parsed.scheme.lower()
    hostname = (parsed.hostname or "").lower()

    ext = tldextract.extract(url_clean)
    subdomain = ext.subdomain.lower()
    domain = ext.domain.lower()
    suffix = ext.suffix.lower()

    # Redact sensitive values from query params (passwords, tokens, emails, phone numbers)
    raw_query = parse_qs(parsed.query)
    safe_query_keys = sorted(raw_query.keys())
    
    # Path segments normalized
    path_segments = [s for s in parsed.path.strip("/").split("/") if s]
    path_depth = len(path_segments)
    path_pattern = "/".join(["[token]" if len(s) > 16 else s for s in path_segments])

    # Detected threat vectors
    vectors = sorted(list(set(detected_vectors or [])))

    # Canonical profile representation
    profile_components = [
        f"SCHEME:{scheme}",
        f"REG_DOMAIN:{domain}.{suffix}" if suffix else f"REG_DOMAIN:{domain}",
        f"SUBDOMAIN_DEPTH:{len(subdomain.split('.')) if subdomain else 0}",
        f"PATH_DEPTH:{path_depth}",
        f"QUERY_KEYS:{','.join(safe_query_keys)}",
        f"VECTORS:{','.join(vectors)}"
    ]
    dna_profile_str = "|".join(profile_components)

    dna_hash = hashlib.sha256(dna_profile_str.encode("utf-8")).hexdigest()

    tokens = set()
    tokens.add(f"domain:{domain}")
    tokens.add(f"tld:{suffix}")
    if subdomain:
        for sub in subdomain.split("."):
            tokens.add(f"sub:{sub}")
    for seg in path_segments[:3]:
        tokens.add(f"path:{seg}")
    for k in safe_query_keys:
        tokens.add(f"param:{k}")
    for v in vectors:
        tokens.add(f"vector:{v}")

    return {
        "dna_hash": dna_hash,
        "dna_profile": dna_profile_str,
        "tokens": list(tokens),
        "structure": {
            "scheme": scheme,
            "registered_domain": f"{domain}.{suffix}" if suffix else domain,
            "subdomain": subdomain,
            "path_depth": path_depth,
            "path_pattern": path_pattern,
            "query_keys": safe_query_keys,
            "threat_vectors": vectors,
        }
    }

def calculate_dna_similarity(tokens_a: list, tokens_b: list) -> float:
    """Calculates Jaccard similarity coefficient between two token sets (0.0 to 1.0)."""
    set_a = set(tokens_a)
    set_b = set(tokens_b)
    if not set_a and not set_b:
        return 1.0
    if not set_a or not set_b:
        return 0.0
    intersection = len(set_a.intersection(set_b))
    union = len(set_a.union(set_b))
    return float(intersection / union) if union > 0 else 0.0
