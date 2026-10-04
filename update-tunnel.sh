#!/bin/bash
# Auto-update Vercel API_BASE_URL when Cloudflare Quick Tunnel restarts
# Backend: http://localhost:8080
# Frontend: Vercel
#
# Run:
#   ./update-tunnel.sh

set -euo pipefail

# ============================================================
# CONFIG
# ============================================================

VERCEL_PROJECT="big-o-frontend"
VERCEL_ORG="algo-next"

LOCAL_BACKEND="http://localhost:8080"
ENV_NAME="production"
ENV_VAR="API_BASE_URL"

# ============================================================
# FUNCTIONS
# ============================================================

cleanup() {
    echo ""
    echo "Stopping Cloudflare tunnel..."

    if [[ -n "${TUNNEL_PID:-}" ]]; then
        kill "$TUNNEL_PID" 2>/dev/null || true
    fi
}

trap cleanup EXIT INT TERM

# ============================================================
# HEADER
# ============================================================

echo "=========================================="
echo " Cloudflare Tunnel + Vercel Auto Updater"
echo "=========================================="

# ============================================================
# CHECK COMMANDS
# ============================================================

echo ""
echo "Checking required commands..."

if ! command -v cloudflared >/dev/null 2>&1; then
    echo "ERROR: cloudflared not found."
    exit 1
fi

if ! command -v vercel >/dev/null 2>&1; then
    echo "ERROR: Vercel CLI not found."
    exit 1
fi

if ! command -v curl >/dev/null 2>&1; then
    echo "ERROR: curl not found."
    exit 1
fi

echo "cloudflared: OK"
echo "vercel:      OK"
echo "curl:        OK"

# ============================================================
# CHECK VERCEL LOGIN
# ============================================================

echo ""
echo "Checking Vercel authentication..."

if ! vercel whoami >/dev/null 2>&1; then
    echo ""
    echo "ERROR: Vercel CLI is not logged in."
    echo ""
    echo "Run:"
    echo "  vercel login"
    echo ""
    exit 1
fi

echo "Vercel authentication: OK"

# ============================================================
# CHECK PROJECT
# ============================================================

echo ""
echo "Checking Vercel project..."

PROJECT_OUTPUT=$(vercel project ls --scope "$VERCEL_ORG" 2>&1)

if echo "$PROJECT_OUTPUT" | grep -q "$VERCEL_PROJECT"; then
    echo "Project found: $VERCEL_ORG/$VERCEL_PROJECT"
else
    echo "ERROR: Project '$VERCEL_PROJECT' not found under '$VERCEL_ORG'."
    echo ""
    echo "$PROJECT_OUTPUT"
    exit 1
fi

# ============================================================
# CHECK LOCAL BACKEND
# ============================================================

echo ""
echo "Checking local backend..."

if curl -s --max-time 5 "$LOCAL_BACKEND" >/dev/null; then
    echo "Backend: $LOCAL_BACKEND is reachable"
else
    echo ""
    echo "ERROR: Backend is not responding at:"
    echo "  $LOCAL_BACKEND"
    echo ""
    echo "Start your backend first."
    exit 1
fi

# ============================================================
# PREPARE LOG
# ============================================================

rm -f /tmp/tunnel.log

# ============================================================
# START CLOUDFLARE QUICK TUNNEL
# ============================================================

echo ""
echo "Starting cloudflared tunnel..."

cloudflared tunnel \
    --url "$LOCAL_BACKEND" \
    --no-autoupdate \
    2>&1 | tee /tmp/tunnel.log &

TUNNEL_PID=$!

echo "cloudflared PID: $TUNNEL_PID"

# ============================================================
# WAIT FOR TUNNEL URL
# ============================================================

echo ""
echo "Waiting for tunnel URL..."

TUNNEL_URL=""

for i in {1..30}; do

    if grep -qE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' /tmp/tunnel.log; then

        TUNNEL_URL=$(
            grep -oE 'https://[a-zA-Z0-9-]+\.trycloudflare\.com' \
            /tmp/tunnel.log \
            | head -1
        )

        break
    fi

    # Check whether cloudflared is still alive
    if ! kill -0 "$TUNNEL_PID" 2>/dev/null; then
        echo ""
        echo "ERROR: cloudflared stopped unexpectedly."
        echo ""
        cat /tmp/tunnel.log
        exit 1
    fi

    sleep 1
done

# ============================================================
# VALIDATE TUNNEL
# ============================================================

if [[ -z "$TUNNEL_URL" ]]; then
    echo ""
    echo "ERROR: Failed to obtain Cloudflare tunnel URL."
    echo ""
    cat /tmp/tunnel.log
    exit 1
fi

API_URL="${TUNNEL_URL}/api"

echo ""
echo "=========================================="
echo " Tunnel created successfully"
echo "=========================================="
echo "Tunnel URL : $TUNNEL_URL"
echo "API URL    : $API_URL"
echo "=========================================="

# ============================================================
# TEST CLOUDFLARE TUNNEL
# ============================================================

echo ""
echo "Waiting for tunnel to become reachable..."

sleep 3

if curl -s --max-time 10 "$TUNNEL_URL" >/dev/null; then
    echo "Cloudflare tunnel: reachable"
else
    echo "WARNING: Tunnel URL is not responding yet."
    echo "Continuing anyway..."
fi

# ============================================================
# UPDATE VERCEL ENVIRONMENT VARIABLE
# ============================================================

echo ""
echo "=========================================="
echo " Updating Vercel environment variable"
echo "=========================================="

echo ""
echo "Removing existing $ENV_VAR..."

vercel env rm "$ENV_VAR" "$ENV_NAME" \
    --scope="$VERCEL_ORG" \
    --project="$VERCEL_PROJECT" \
    --yes 2>/dev/null || true

echo "Old variable removed."

echo ""
echo "Adding new $ENV_VAR..."

# Vercel CLI 62.x asks:
#
#   ? Value?
#
# Pipe the value directly into stdin.
printf '%s\n' "$API_URL" | \
vercel env add "$ENV_VAR" "$ENV_NAME" \
    --scope="$VERCEL_ORG" \
    --project="$VERCEL_PROJECT" \
    --yes

echo ""
echo "$ENV_VAR updated successfully."

# ============================================================
# VERIFY ENVIRONMENT VARIABLE
# ============================================================

echo ""
echo "Verifying Vercel environment variable..."

if vercel env ls "$ENV_NAME" \
    --scope="$VERCEL_ORG" \
    --project="$VERCEL_PROJECT" \
    | grep -q "$ENV_VAR"; then

    echo "$ENV_VAR exists in $ENV_NAME."
else
    echo "WARNING: Could not verify $ENV_VAR."
fi

# ============================================================
# REDEPLOY FRONTEND
# ============================================================

echo ""
echo "=========================================="
echo " Redeploying frontend"
echo "=========================================="

vercel --prod \
    --scope="$VERCEL_ORG" \
    --project="$VERCEL_PROJECT" \
    --yes

# ============================================================
# SUCCESS
# ============================================================

echo ""
echo "=========================================="
echo " SUCCESS"
echo "=========================================="

echo ""
echo "Frontend:"
echo "https://big-o-frontend.vercel.app"

echo ""
echo "Cloudflare Tunnel:"
echo "$TUNNEL_URL"

echo ""
echo "API:"
echo "$API_URL"

echo ""
echo "Vercel:"
echo "$VERCEL_ORG/$VERCEL_PROJECT"

echo ""
echo "=========================================="
echo " Cloudflare tunnel is running."
echo " Press Ctrl+C to stop."
echo "=========================================="

# ============================================================
# KEEP TUNNEL ALIVE
# ============================================================

wait "$TUNNEL_PID"