# 📘 Owtlet™ Production Deployment Runbook (`owtlet.com`)

> **Document Version**: 1.0  
> **Lead Architect & Maintainer**: `ultron` (DevOps & Cyber Security Specialist)  
> **Target Production Launch**: December 1, 2026  
> **Primary Domain**: `https://owtlet.com` (Storefront & API)  
> **Redirect Domain**: `https://owtlet.live` (301 Permanent Redirect → `https://owtlet.com`)  
> **Status**: Gated by **Q-003** (Client VPS IP & DNS Cutover)

---

## 1. System Topology & Architecture

Owtlet is containerized using a decoupled multi-container architecture orchestrated via Docker Compose:

```
                                  [ Internet Traffic ]
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                 [ Port 80 (HTTP) ]                   [ Port 443 (HTTPS) ]
                        │                                     │
           (ACME challenge / 301 HTTPS)           (TLS Termination / HSTS / CSP)
                        │                                     │
                        └──────────────────┬──────────────────┘
                                           │
                                  ┌────────▼────────┐
                                  │   Nginx 1.27    │
                                  │ (Reverse Proxy) │
                                  └──┬───────────┬──┘
                  ┌──────────────────┘           └──────────────────┐
        (Static / Pages / SSR)                          (REST API / Webhooks)
                  │                                                 │
          ┌───────▼────────┐                                ┌───────▼────────┐
          │   owtlet_web   │                                │ owtlet_backend │
          │ Next.js 14 App │                                │   NestJS 10    │
          │  (Port 3000)   │                                │  (Port 4000)   │
          └───────┬────────┘                                └───────┬────────┘
                  │                                                 │
                  └──────────────────┬──────────────────────────────┘
                                     │
                           ┌─────────▼─────────┐
                           │  owtlet_postgres  │
                           │   PostgreSQL 16   │
                           │    (Port 5432)    │
                           └───────────────────┘
```

---

## 2. Server Prerequisites & Hardening

### 2.1 Recommended VPS Specs
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS (x86_64 or ARM64)
- **Compute**: Minimum 2 vCPU, 4 GB RAM (8 GB recommended for concurrent video traffic)
- **Storage**: 40 GB+ NVMe SSD
- **Network**: 1 Gbps port with static public IPv4

### 2.2 Initial Server Hardening & UFW Firewall
```bash
# Update base system
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ufw curl wget git ca-certificates gnupg lsb-release

# Configure strict UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt / 301)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2.3 Install Docker Engine & Docker Compose Plugin
```bash
# Add Docker official GPG key and repo
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

---

## 3. DNS Configuration & Pre-Cutover Verification

Configure the following DNS records with the domain registrar / DNS provider:

| Host / Subdomain | Type | Value | Target Purpose |
|---|---|---|---|
| `owtlet.com` | `A` | `<VPS_STATIC_IP>` | Main Storefront & API |
| `www.owtlet.com` | `A` or `CNAME` | `<VPS_STATIC_IP>` or `owtlet.com` | Canonical Redirect to Apex |
| `owtlet.live` | `A` | `<VPS_STATIC_IP>` | 301 Redirect to `owtlet.com` (REQ-F-019) |
| `www.owtlet.live` | `A` or `CNAME` | `<VPS_STATIC_IP>` or `owtlet.live` | 301 Redirect to `owtlet.com` |

> ⚠️ **Scope Boundary Warning**: `owtlet.shop` (Shopify accessories store) is a separate project handled by another team member. **DO NOT** modify DNS records for `owtlet.shop`.

Verify DNS propagation before running SSL certification:
```bash
dig +short A owtlet.com
dig +short A owtlet.live
```

---

## 4. Production Repository Setup & Secret Generation

```bash
# Clone production repository to standard deployment path
sudo mkdir -p /opt/owtlet
sudo chown -R $USER:$USER /opt/owtlet
git clone <git-repo-url> /opt/owtlet
cd /opt/owtlet

# Initialize production environment configuration
cp .env.example .env
chmod 600 .env
```

### 4.1 Cryptographic Secret Generation
Run the following commands to generate 256-bit cryptographic keys for `.env`:
```bash
# Generate high-entropy keys
openssl rand -base64 48   # For AGE_COOKIE_SECRET
openssl rand -base64 48   # For ADMIN_SESSION_SECRET
openssl rand -base64 48   # For SHOPPER_SESSION_SECRET
openssl rand -base64 48   # For CONFIRMATION_LINK_SECRET
openssl rand -hex 24      # For IP_HASH_SALT
openssl rand -hex 16      # For POSTGRES_PASSWORD
```

Ensure `.env` contains:
```env
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://owtlet.com
APP_TIMEZONE=America/New_York

POSTGRES_USER=owtlet
POSTGRES_PASSWORD=<GENERATED_POSTGRES_PASSWORD>
POSTGRES_DB=owtlet
DATABASE_URL=postgresql://owtlet:<GENERATED_POSTGRES_PASSWORD>@postgres:5432/owtlet?schema=public

AGE_COOKIE_SECRET=<GENERATED_AGE_COOKIE_SECRET>
ADMIN_SESSION_SECRET=<GENERATED_ADMIN_SESSION_SECRET>
SHOPPER_SESSION_SECRET=<GENERATED_SHOPPER_SESSION_SECRET>
CONFIRMATION_LINK_SECRET=<GENERATED_CONFIRMATION_LINK_SECRET>
IP_HASH_SALT=<GENERATED_IP_HASH_SALT>

SEED_ADMIN_EMAIL=admin@owtlet.com
SEED_ADMIN_PASSWORD=<GENERATED_STRONG_ADMIN_PASSWORD>

NEXT_PUBLIC_TERRIFIC_STORE_ID=BX2hWAVam9JjsFhXP5ZF
NEXT_PUBLIC_TERRIFIC_EMBEDDING_ID=Cki70GhqvLgWGhJbSxg2
NEXT_PUBLIC_TERRIFIC_SDK_URL=https://terrific.live/terrific-sdk.js
```

Sync environment to frontend and backend:
```bash
bash scripts/sync-env.sh
```

---

## 5. SSL / Let's Encrypt Certificate Bootstrap

Execute the automated SSL initializer:
```bash
cd /opt/owtlet
bash infrastructure/docker/init-letsencrypt.sh production ops@owtlet.com
```

The script will:
1. Generate temporary dummy certificates to permit Nginx startup.
2. Launch Nginx in standalone ACME validation mode.
3. Call Certbot to request production multi-domain SAN certificates for:
   - `owtlet.com`
   - `www.owtlet.com`
   - `owtlet.live`
   - `www.owtlet.live`
4. Replace dummy certificates and reload Nginx with HTTP/2 and modern TLS.

---

## 6. Full Stack Container Launch & Database Migration

### 6.1 Start Containers under Production Profile
```bash
cd /opt/owtlet/infrastructure/docker
docker compose --profile prod up -d --build
```

### 6.2 Apply Database Migrations & Seed Baseline Data
```bash
# Execute Prisma migration on the backend container
docker compose exec backend npx prisma migrate deploy

# Seed New York coverage ZIPs, partner dispensaries, and initial catalog
docker compose exec backend npx tsx prisma/seed.ts

# Optional: Run Shopify cannabis product migration
docker compose exec backend npx tsx prisma/seed-shopify-import.ts
```

---

## 7. Verification & Acceptance Smoke Tests

Execute Thanos verification checks against the live VPS deployment:

### 7.1 HTTPS Health Check
```bash
curl -sI https://owtlet.com | grep "HTTP/2 200"
curl -s https://owtlet.com/api/health
```
*Expected JSON*: `{"success":true,"data":{"status":"ok","database":"connected","timestamp":"..."}}`

### 7.2 owtlet.live 301 Redirect Check (AC-RDR-01, REQ-F-019)
```bash
curl -sI https://owtlet.live/shop | grep -E "HTTP/2 301|location:"
```
*Expected Response*:
```http
HTTP/2 301
location: https://owtlet.com/shop
```

### 7.3 Canonical Apex Redirect Check (www -> apex)
```bash
curl -sI https://www.owtlet.com | grep -E "HTTP/2 301|location:"
```
*Expected Response*: `location: https://owtlet.com/`

### 7.4 Plain HTTP Redirect Check (Port 80 -> HTTPS)
```bash
curl -sI http://owtlet.com | grep -E "HTTP/1.1 301|Location:"
```
*Expected Response*: `Location: https://owtlet.com/`

### 7.5 Security Headers Verification
```bash
curl -sI https://owtlet.com | grep -E -i "(strict-transport-security|content-security-policy|x-content-type-options|x-frame-options)"
```
*Expected Output*:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://terrific.live; ...`

---

## 8. Automated Daily Backups & Maintenance

### 8.1 Configure Cron for Daily Automated Backup
Schedule the backup script to run every day at 02:00 AM EST:
```bash
sudo crontab -e
```
Add the following line:
```cron
0 2 * * * /opt/owtlet/infrastructure/backup/daily-backup.sh >> /var/log/owtlet-backup.log 2>&1
```

### 8.2 Manual Backup Execution
```bash
bash /opt/owtlet/infrastructure/backup/daily-backup.sh
```

---

## 9. Rollback & Disaster Recovery Runbook

### 9.1 Database Restoration
To restore a snapshot in case of corruption or data loss:
```bash
cd /opt/owtlet/infrastructure/docker

# 1. Stop web and backend traffic
docker compose stop web backend

# 2. Decompress and restore database
gunzip -c /opt/owtlet/backups/owtlet_db_<TIMESTAMP>.sql.gz | docker exec -i owtlet_postgres psql -U owtlet -d owtlet

# 3. Restart application containers
docker compose start backend web
```

### 9.2 Application Version Rollback
If a newly deployed commit introduces critical bugs:
```bash
cd /opt/owtlet
git checkout <PREVIOUS_STABLE_COMMIT_SHA>
cd infrastructure/docker
docker compose --profile prod up -d --build --no-deps web backend
docker compose exec nginx nginx -s reload
```

---

## 10. Human Approval Gate Checklist

Per Avengers Protocol Rule §6, ensure human approval is obtained before:
- [ ] Executing destructive database migrations on production data.
- [ ] Changing production secrets or `.env` credentials.
- [ ] Pointing live production DNS (`owtlet.com` / `owtlet.live`) to the VPS.

