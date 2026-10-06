#!/usr/bin/env python3
"""Local static preview server with production-style clean HTML routes."""

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit


PUBLIC_ROOT = Path(__file__).resolve().parent / "public_html"
PORT = 4173


class CleanRouteHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_ROOT), **kwargs)

    def do_GET(self):
        self._serve_clean_route()

    def do_HEAD(self):
        self._serve_clean_route()

    def _serve_clean_route(self):
        parsed = urlsplit(self.path)
        route = parsed.path.rstrip("/")

        if route == "/index.html":
            self.send_response(301)
            self.send_header("Location", "/" + (f"?{parsed.query}" if parsed.query else ""))
            self.end_headers()
            return

        if route.endswith(".html") and route != "/index.html":
            clean = route[:-5] or "/"
            suffix = f"?{parsed.query}" if parsed.query else ""
            self.send_response(301)
            self.send_header("Location", clean + suffix)
            self.end_headers()
            return

        candidate = PUBLIC_ROOT / f"{route.lstrip('/')}.html"
        if route and candidate.is_file():
            query = f"?{parsed.query}" if parsed.query else ""
            self.path = f"/{candidate.name}{query}"

        super().do_GET() if self.command == "GET" else super().do_HEAD()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("0.0.0.0", PORT), CleanRouteHandler)
    print(f"Ayaan preview: http://127.0.0.1:{PORT}")
    server.serve_forever()
