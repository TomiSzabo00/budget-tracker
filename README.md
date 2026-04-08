> [!IMPORTANT]
> This whole repo was vibecoded so read the code before you use it. Use this at your own risk.

# Budget Tracker

A self-hosted personal budget tracker with expense categorization, monthly/yearly summaries, and webhook-based transaction ingestion. Data is stored in a local SQLite database — no external services required.

## Features

- **Dashboard** — monthly income, spending, savings, and investment overview with a category breakdown and donut chart
- **Yearly summary** — annual view across all months at a glance
- **Transaction list** — filterable by date range, category, and search term; inline category assignment
- **Clickable categories** — click any category on the dashboard to jump straight to its transactions
- **Webhook ingestion** — receive transactions via HTTP POST from external sources (e.g. [banking-sync](https://github.com/TomiSzabo00/banking-sync))
- **HMAC-verified webhooks** — optionally validate incoming payloads with a shared secret
- **Excluded categories** — mark categories as excluded so they don't skew summaries
- **Belongs-to-month override** — reassign transactions to a different month for accurate period tracking
- **Investment toggle** — show or hide investment transactions in charts
- **SQLite storage** — single-file database, no external DB needed

## Prerequisites

- Node.js 20+
- npm

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/TomiSzabo00/budget-tracker-fe2.git
cd budget-tracker-fe2

# 2. Install dependencies
npm install

# 3. Create your env file
cp .env.local .env.local   # already exists — edit WEBHOOK_SECRET

# 4. Initialize the database
npm run db:migrate

# 5. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker

```bash
# 1. Clone the repo
git clone https://github.com/TomiSzabo00/budget-tracker-fe2.git
cd budget-tracker-fe2

# 2. Create your env file
cp .env.local .env
# Edit .env — at minimum set WEBHOOK_SECRET

# 3. Start the container
docker compose up -d
```

The container seeds the database on first start, then serves the app on port 3000 (configurable via `PORT` in `.env`). Data is persisted in a named Docker volume (`budget-data`).

### Proxmox LXC

If you run Proxmox, there's a script that creates a dedicated LXC container with everything pre-installed:

> [!TIP]
> You can copy the checked out repository from your computer to your Proxmox host with `scp -r budget-tracker-fe2 user@<proxmox-host-ip>:/path/to/destination`

```bash
# 1. Edit the variables at the top of the script (CT_ID, CT_IP, CT_GW, etc.)
nano proxmox/proxmox-create-lxc.sh

# 2. Run it on the Proxmox HOST (not inside a container)
./proxmox/proxmox-create-lxc.sh
```

The script creates a minimal Debian 12 container, installs Node.js 20, builds the app, seeds the database, and enables the systemd service.

## Configuration

All configuration is done via environment variables in your `.env` file.

| Variable | Default | Description |
|----------|---------|-------------|
| `WEBHOOK_SECRET` | _(none)_ | Shared secret for HMAC-verifying incoming webhooks. Leave empty to skip verification. |
| `DATA_DIR` | `./` (cwd) | Directory where the SQLite database file is stored. |
| `PORT` | `3000` | Port the app listens on (Docker / systemd only). |

## Webhook API

Budget Tracker accepts transactions pushed from external sources over HTTP.

### Ingest a transaction

```
POST /api/webhooks
```

Payload (JSON):

```json
{
  "amount": -42.50,
  "currency": "EUR",
  "description": "Grocery store",
  "date": "2025-04-01",
  "tx_hash": "abc123"
}
```

| Field | Type | Description |
|-------|------|-------------|
| `amount` | number | Negative = expense, positive = income |
| `currency` | string | ISO 4217 currency code |
| `description` | string | Transaction description / merchant name |
| `date` | string (ISO date) | Transaction date |
| `tx_hash` | string | Unique hash for deduplication |

If `WEBHOOK_SECRET` is set, include an `X-Webhook-Signature` header containing the HMAC-SHA256 hex digest of the raw JSON body.

## Managing the Service (systemd)

After a Proxmox LXC install, the app runs as a systemd service:

```bash
# Check status
sudo systemctl status budget-tracker

# View live logs
sudo journalctl -u budget-tracker -f

# Restart after config changes
sudo systemctl restart budget-tracker

# Stop the service
sudo systemctl stop budget-tracker
```

## License

[MIT](LICENSE)
