#!/usr/bin/env python3
# Serve the Fields & Vector Spaces Lab locally:  python3 serve.py   →  http://localhost:8211
import os, http.server
os.chdir(os.path.dirname(os.path.abspath(__file__)))
print("Serving Fields & Vector Spaces Lab at http://localhost:8211  (Ctrl-C to stop)")
http.server.HTTPServer(("localhost", 8211), http.server.SimpleHTTPRequestHandler).serve_forever()
