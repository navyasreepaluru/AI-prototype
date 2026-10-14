import socket
import ipaddress
from urllib.parse import urlparse
import requests
import ssl
from datetime import datetime, timezone

BLOCKED_IP_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("100.64.0.0/10"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),       # Link-local & Cloud Metadata (AWS/GCP/Azure)
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.0.0.0/24"),
    ipaddress.ip_network("192.0.2.0/24"),
    ipaddress.ip_network("192.88.99.0/24"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("198.18.0.0/15"),
    ipaddress.ip_network("198.51.100.0/24"),
    ipaddress.ip_network("203.0.113.0/24"),
    ipaddress.ip_network("224.0.0.0/4"),          # Multicast
    ipaddress.ip_network("240.0.0.0/4"),          # Reserved
    ipaddress.ip_network("255.255.255.255/32"),
    # IPv6 ranges
    ipaddress.ip_network("::1/128"),              # Loopback
    ipaddress.ip_network("fc00::/7"),             # Unique local
    ipaddress.ip_network("fe80::/10"),            # Link-local
]

def is_ip_allowed(ip_str: str) -> bool:
    """Checks whether an IP address is a safe public routable IP."""
    try:
        ip = ipaddress.ip_address(ip_str)
        if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_multicast or ip.is_reserved:
            return False
        for net in BLOCKED_IP_NETWORKS:
            if ip in net:
                return False
        return True
    except Exception:
        return False

def resolve_and_verify_hostname(hostname: str) -> tuple[bool, str, list[str]]:
    """Resolves DNS and verifies all resolved IPs against SSRF protection policies."""
    clean_host = hostname.split(":")[0].strip("[]")
    try:
        addr_info = socket.getaddrinfo(clean_host, None)
        ips = list(set([item[4][0] for item in addr_info]))
        if not ips:
            return False, "DNS resolution yielded no IP addresses.", []
        
        for ip in ips:
            if not is_ip_allowed(ip):
                return False, f"SSRF Protection Block: Resolved address '{ip}' falls in a private, loopback, or metadata restricted network range.", ips
        
        return True, "Address is safe and public.", ips
    except socket.gaierror as e:
        return False, f"DNS Resolution failed: {str(e)}", []
    except Exception as e:
        return False, f"Address verification error: {str(e)}", []

def inspect_ssl_certificate(hostname: str, port: int = 443) -> dict:
    """Inspects SSL certificate safely without downloading website body."""
    try:
        context = ssl.create_default_context()
        with socket.create_connection((hostname, port), timeout=3.0) as sock:
            with context.wrap_socket(sock, server_hostname=hostname) as ssock:
                cert = ssock.getpeercert()
                issuer = dict(x[0] for x in cert.get("issuer", []))
                subject = dict(x[0] for x in cert.get("subject", []))
                not_after = cert.get("notAfter")
                return {
                    "valid": True,
                    "issuer_common_name": issuer.get("commonName", "Unknown"),
                    "issuer_organization": issuer.get("organizationName", "Unknown"),
                    "subject_common_name": subject.get("commonName", "Unknown"),
                    "expires_at": not_after,
                    "version": cert.get("version"),
                }
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "note": "Could not verify SSL certificate or host does not support standard TLS."
        }

def safe_inspect_url(url: str) -> dict:
    """
    Safely inspects a URL with comprehensive SSRF protection, strict timeouts,
    header inspection, and no unsafe script execution.
    """
    clean_url = (url or "").strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url

    parsed = urlparse(clean_url)
    scheme = parsed.scheme.lower()
    hostname = parsed.hostname

    if scheme not in ["http", "https"]:
        return {
            "allowed": False,
            "inspected": False,
            "reason": f"Disallowed protocol scheme '{scheme}'. Only HTTP and HTTPS are permitted."
        }

    if not hostname:
        return {
            "allowed": False,
            "inspected": False,
            "reason": "Invalid or missing hostname."
        }

    # Verify DNS & SSRF
    is_safe, verify_msg, ips = resolve_and_verify_hostname(hostname)
    if not is_safe:
        return {
            "allowed": False,
            "inspected": False,
            "reason": verify_msg,
            "resolved_ips": ips,
            "hostname": hostname
        }

    inspection_data = {
        "allowed": True,
        "inspected": True,
        "hostname": hostname,
        "resolved_ips": ips,
        "scheme": scheme,
        "status_code": None,
        "server_header": None,
        "content_type": None,
        "content_length": None,
        "ssl_certificate": None,
        "security_headers": {},
        "notes": []
    }

    # Check SSL if HTTPS
    if scheme == "https":
        ssl_info = inspect_ssl_certificate(hostname, parsed.port or 443)
        inspection_data["ssl_certificate"] = ssl_info
        if ssl_info.get("issuer_organization") in ["Let's Encrypt", "cPanel, Inc.", "Cloudflare"]:
            inspection_data["notes"].append(
                f"SSL issued by '{ssl_info.get('issuer_organization')}'. Free automated SSL certs are popular for phishing as well as legitimate sites."
            )

    # Perform lightweight HEAD request (safe, no body fetched)
    try:
        headers = {
            "User-Agent": "CyberShield-Inspection-Bot/1.0 (+https://cybershield.ai/bot-policy)"
        }
        res = requests.head(clean_url, headers=headers, timeout=3.0, allow_redirects=False)
        inspection_data["status_code"] = res.status_code
        inspection_data["server_header"] = res.headers.get("Server", "Undisclosed")
        inspection_data["content_type"] = res.headers.get("Content-Type", "Unknown")
        inspection_data["content_length"] = res.headers.get("Content-Length")

        # Check defensive security headers
        sec_headers = {
            "Strict-Transport-Security": bool(res.headers.get("Strict-Transport-Security")),
            "Content-Security-Policy": bool(res.headers.get("Content-Security-Policy")),
            "X-Frame-Options": bool(res.headers.get("X-Frame-Options")),
            "X-Content-Type-Options": bool(res.headers.get("X-Content-Type-Options")),
        }
        inspection_data["security_headers"] = sec_headers

        if not any(sec_headers.values()):
            inspection_data["notes"].append("Missing standard modern security response headers (HSTS, CSP, X-Frame-Options).")

    except requests.exceptions.Timeout:
        inspection_data["notes"].append("Remote server timed out during safe connection inspection.")
    except Exception as e:
        inspection_data["notes"].append(f"Inspection connection warning: {str(e)}")

    return inspection_data
