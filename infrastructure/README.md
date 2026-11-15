# Infrastructure Configurations (`infrastructure/`)

This directory houses infrastructure, containerization, and web server configurations.

## Subdirectories
- **`docker/`**: `Dockerfile.frontend` (the single Owtlet Next.js `web` image — UI + `/api`) and `docker-compose.yml` (postgres, optional redis, web + nginx under the `prod` profile). No separate backend image (ADR-015).
- **`nginx/`**: `nginx.conf` — HTTPS for `owtlet.com`, `www` → apex, `owtlet.live` → 301 `https://owtlet.com` (REQ-F-019), rate limits.
