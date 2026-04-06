#!/usr/bin/env bash
# =============================================================================
# Budget Tracker — Proxmox LXC Setup Script
# Run this on your Proxmox HOST (not inside a container).
#
# What it does:
#   1. Downloads the Debian 12 template (if not cached)
#   2. Creates an unprivileged LXC container
#   3. Installs Node.js 20, builds the app
#   4. Pushes application files and systemd service into the container
#   5. Seeds the database and enables the service
# =============================================================================
set -euo pipefail

# ── Configuration — edit these to match your environment ─────────────────────
CT_ID=211                        # any free CT ID
CT_HOSTNAME="budget-tracker"     # hostname for the container
CT_IP="192.168.1.61"             # static IP for the container
CT_GW="192.168.1.1"              # gateway (your router's IP)
CT_CIDR="24"
CT_DNS="192.168.1.1 8.8.8.8"
CT_STORAGE="local-lvm"           # storage pool
CT_DISK_GB=4
CT_RAM_MB=1024
CT_SWAP_MB=512
CT_CORES=2
CT_TEMPLATE_STORAGE="local"
CT_OS_TEMPLATE="debian-12-standard_12.12-1_amd64.tar.zst"
APP_DIR="/opt/budget-tracker"
APP_USER="budget-tracker"
APP_PORT=3000
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${SCRIPT_DIR}/.."
SERVICE_FILE="${SCRIPT_DIR}/../budget-tracker.service"
TEMPLATE_PATH="${CT_TEMPLATE_STORAGE}:vztmpl/${CT_OS_TEMPLATE}"

# ── Preflight checks ────────────────────────────────────────────────────────
if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "Error: package.json not found. Run this from the proxmox/ directory inside the repo."
  exit 1
fi

if pct status "${CT_ID}" &>/dev/null; then
  echo "Error: Container ${CT_ID} already exists. Delete it first or choose a different CT_ID."
  exit 1
fi

# ── 1. Ensure template is available ─────────────────────────────────────────
echo "==> Checking for Debian 12 template..."
if ! pveam list "${CT_TEMPLATE_STORAGE}" | grep -q "${CT_OS_TEMPLATE}"; then
  echo "    Downloading template..."
  pveam update
  pveam download "${CT_TEMPLATE_STORAGE}" "${CT_OS_TEMPLATE}"
fi

# ── 2. Create container ─────────────────────────────────────────────────────
echo "==> Creating LXC container ${CT_ID} (${CT_HOSTNAME})..."
pct create "${CT_ID}" "${TEMPLATE_PATH}" \
  --hostname "${CT_HOSTNAME}" \
  --storage "${CT_STORAGE}" \
  --rootfs "${CT_STORAGE}:${CT_DISK_GB}" \
  --memory "${CT_RAM_MB}" \
  --swap "${CT_SWAP_MB}" \
  --cores "${CT_CORES}" \
  --net0 "name=eth0,bridge=vmbr0,ip=${CT_IP}/${CT_CIDR},gw=${CT_GW},firewall=0" \
  --nameserver "${CT_DNS}" \
  --unprivileged 1 \
  --features "nesting=0" \
  --start 0

# ── 3. Start and wait for network ───────────────────────────────────────────
echo "==> Starting container..."
pct start "${CT_ID}"
sleep 3

echo "==> Waiting for network..."
for i in $(seq 1 15); do
  if pct exec "${CT_ID}" -- ping -c1 -W2 8.8.8.8 &>/dev/null; then
    echo "    Network is up."
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "Error: Network not reachable after 75 seconds. Check CT_IP/CT_GW."
    exit 1
  fi
  sleep 5
done

# ── 4. Install Node.js 20 inside the container ──────────────────────────────
echo "==> Installing Node.js 20..."
pct exec "${CT_ID}" -- bash -s <<'INNER'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl ca-certificates gnupg build-essential python3
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
  | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" \
  > /etc/apt/sources.list.d/nodesource.list
apt-get update -qq
apt-get install -y -qq nodejs
echo "Node.js $(node -v) installed."
INNER

# ── 5. Push application files ───────────────────────────────────────────────
echo "==> Pushing application files..."
pct exec "${CT_ID}" -- mkdir -p "${APP_DIR}"

# Create a tarball of the source (excluding node_modules, .next, .git, db files)
TMPTAR=$(mktemp /tmp/budget-tracker-XXXXXX.tar.gz)
tar -czf "$TMPTAR" -C "$REPO_DIR" \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='.git' \
  --exclude='*.db' \
  --exclude='*.db-wal' \
  --exclude='*.db-shm' \
  .

pct push "${CT_ID}" "$TMPTAR" "/tmp/budget-tracker.tar.gz"
rm -f "$TMPTAR"

pct exec "${CT_ID}" -- bash -c "tar -xzf /tmp/budget-tracker.tar.gz -C ${APP_DIR} && rm /tmp/budget-tracker.tar.gz"

# ── 5b. Write .env with correct paths ───────────────────────────────────────
echo "==> Writing .env configuration..."
pct exec "${CT_ID}" -- bash -c "cat > ${APP_DIR}/.env" <<EOF
# Budget Tracker Configuration
# Edit WEBHOOK_SECRET to match your banking-sync service config.
WEBHOOK_SECRET=change-me-to-a-real-secret
DATA_DIR=${APP_DIR}/data
PORT=${APP_PORT}
EOF

# ── 6. Build the application ────────────────────────────────────────────────
echo "==> Installing dependencies and building..."
pct exec "${CT_ID}" -- bash -s -- "${APP_DIR}" <<'INNER'
set -euo pipefail
APP_DIR="$1"
cd "$APP_DIR"
npm ci --production=false
NODE_OPTIONS="--max-old-space-size=768" npm run build
# Clean dev dependencies after build
npm prune --production
# Install tsx globally for seed script
npm install -g tsx
INNER

# ── 7. Push and configure systemd service ────────────────────────────────────
echo "==> Setting up systemd service..."

sed "s|__APP_DIR__|${APP_DIR}|g; s|__PORT__|${APP_PORT}|g" "${SERVICE_FILE}" \
  | pct exec "${CT_ID}" -- tee /etc/systemd/system/budget-tracker.service > /dev/null

pct exec "${CT_ID}" -- sed -i "/^Type=simple/a User=${APP_USER}" \
  /etc/systemd/system/budget-tracker.service

# ── 8. Create user, seed DB, set permissions ─────────────────────────────────
echo "==> Configuring user, database, and permissions..."
pct exec "${CT_ID}" -- bash -s -- "${APP_DIR}" "${APP_USER}" <<'INNER'
set -euo pipefail
APP_DIR="$1"
APP_USER="$2"

# Create service user
id -u "$APP_USER" &>/dev/null || useradd -r -s /usr/sbin/nologin -d "$APP_DIR" "$APP_USER"

# Create data directory
mkdir -p "${APP_DIR}/data"

# Seed the database
cd "$APP_DIR"
export DATA_DIR="${APP_DIR}/data"
tsx src/db/seed.ts

# Set ownership
chown -R "${APP_USER}:${APP_USER}" "$APP_DIR"
chmod 750 "$APP_DIR"
chmod 700 "${APP_DIR}/data"

# Enable service
systemctl daemon-reload
systemctl enable budget-tracker
INNER

echo ""
echo "================================================================"
echo " LXC ${CT_ID} (${CT_HOSTNAME}) is ready at ${CT_IP}"
echo ""
echo " Next steps:"
echo "   1. Edit the config:"
echo "      pct exec ${CT_ID} -- nano ${APP_DIR}/.env"
echo "      → Set WEBHOOK_SECRET to match your banking-sync service"
echo ""
echo "   2. Start the service:"
echo "      pct exec ${CT_ID} -- systemctl start budget-tracker"
echo ""
echo "   3. Open in browser:"
echo "      http://${CT_IP}:${APP_PORT}"
echo ""
echo "   4. Configure banking-sync webhooks (in config.yaml):"
echo "      webhooks:"
echo "        endpoints:"
echo "          - url: \"http://${CT_IP}:${APP_PORT}/webhooks\""
echo "            secret: \"YOUR_WEBHOOK_SECRET\""
echo "            events:"
echo "              - new_transaction"
echo "              - sync_completed"
echo "              - auth_required"
echo ""
echo " Useful commands:"
echo "   pct exec ${CT_ID} -- systemctl status budget-tracker"
echo "   pct exec ${CT_ID} -- journalctl -u budget-tracker -f"
echo "   pct exec ${CT_ID} -- systemctl restart budget-tracker"
echo "================================================================"
