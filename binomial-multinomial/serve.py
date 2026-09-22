#!/usr/bin/env python3
# Serve the Binomial & Multinomial Lab locally:  python3 serve.py   →  http://localhost:8210
import os, http.server
os.chdir(os.path.dirname(os.path.abspath(__file__)))
print("Serving Binomial & Multinomial Lab at http://localhost:8210  (Ctrl-C to stop)")
http.server.HTTPServer(("localhost", 8210), http.server.SimpleHTTPRequestHandler).serve_forever()
