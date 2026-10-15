import os
import sys
from pathlib import Path

# Ensure workspace root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app import create_app

app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    host = os.environ.get("HOST", "0.0.0.0")
    
    print(f"===========================================================")
    print(f"  CyberShield AI Production Backend Deployed")
    print(f"  Binding: http://{host}:{port}")
    print(f"  Health Check: http://{host}:{port}/api/health")
    print(f"===========================================================")
    
    # Try importing waitress or gunicorn if available, else use Werkzeug multi-threaded server
    try:
        from waitress import serve
        print("Serving via Waitress production WSGI...")
        serve(app, host=host, port=port, threads=6)
    except ImportError:
        from werkzeug.serving import run_simple
        print("Serving via Werkzeug multi-threaded WSGI...")
        run_simple(host, port, app, threaded=True, use_reloader=False)
