#!/bin/bash
# Simple tunnel starter - just shows the URL
# Run: ./start-tunnel.sh

echo "Starting cloudflared tunnel for backend..."
echo "Copy the https://xxx.trycloudflare.com URL below"
echo "Then update in Vercel: Settings → Environment Variables → API_BASE_URL"
echo ""

cloudflared tunnel --url http://localhost:8080