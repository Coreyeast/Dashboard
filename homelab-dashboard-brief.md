# Homelab dashboard — project brief

## Overview

Build a self-hosted dashboard for a Proxmox-hosted Ubuntu server running a Docker-based media stack (Jellyfin, Seerr, Sonarr, Radarr, qBittorrent). The dashboard runs as an additional container in the existing Docker Compose setup.

## Tech stack

- **Framework:** SvelteKit (latest stable, using Vite)
- **Styling:** Tailwind CSS
- **Deployment:** Single Docker container added to the existing `/docker/compose.yaml` file. You can reference the current file in `compose.yaml`.
- **No database** — configuration lives in a JSON file or environment variables

## Phase 1 scope (build this now)

### Feature 1: Application tiles

A grid of clickable tiles, one per service. Each tile links to the service's web UI.

**Tile config** is driven by a single JSON config file (`/app/config/apps.json`) so the user can add/remove apps without touching code:

```json
[
  {
    "name": "Jellyfin",
    "url": "http://192.168.0.76:8096",
    "icon": "jellyfin",
    "color": "#7B5EA7",
    "description": "Media streaming"
  }
]
```

Each tile should display:
- App name
- Colour-coded icon/badge (use the first two letters of the app name as fallback if no icon SVG exists)
- The port or short URL as a subtitle
- Clicking the tile opens the URL in a new tab

Include entries for: Jellyfin (:8096), Seerr (:5055), Sonarr (:8989), Radarr (:7878), qBittorrent (:8080).

### Feature 2: Host storage statistics

Display disk usage for mounted volumes and basic system stats (RAM, maybe CPU).

**Backend approach:**
- Create a SvelteKit server API route: `GET /api/storage`
- Inside the container, mount the host root filesystem read-only at `/host` (see Docker config below)
- Use Node.js `child_process` to run `df -h` reading from `/host` to get disk usage
- Parse and return as JSON: mount point, total, used, available, percentage
- Also read `/host/proc/meminfo` for RAM stats

**Frontend approach:**
- On page load, call `/api/storage`
- Display each mount point as a card with a progress bar
- Colour the bar based on usage: green (<60%), amber (60-80%), red (>80%)
- Add a refresh button or auto-refresh every 5 mintues

## Phase 2 scope (build later, do not implement yet)

### Feature 3: qBittorrent live torrent module

- Poll the qBittorrent Web API (`/api/v2/torrents/info`) every 5 seconds via a SvelteKit server route (to avoid CORS)
- Display a list of active torrents with: name, progress bar, download/upload speed, ETA, status
- Add controls per torrent: pause, resume, set priority (via qBit API)
- qBittorrent API auth: use the `/api/v2/auth/login` endpoint, store the session cookie server-side

### Feature 4: Live service status on tiles

- Ping each service's API on an interval to show online/offline badges on the tiles
- Sonarr/Radarr: show queue count; Jellyfin: show active streams

## Project structure

```
homelab-dashboard/
├── Dockerfile
├── package.json
├── svelte.config.js
├── tailwind.config.js
├── vite.config.js
├── config/
│   └── apps.json              # App tile configuration
├── src/
│   ├── app.html
│   ├── app.css                # Tailwind imports
│   ├── lib/
│   │   ├── components/
│   │   │   ├── AppTile.svelte
│   │   │   ├── AppGrid.svelte
│   │   │   ├── StorageCard.svelte
│   │   │   └── StoragePanel.svelte
│   │   └── utils/
│   │       └── storage.js     # Helpers for parsing df output etc.
│   ├── routes/
│   │   ├── +page.svelte       # Main dashboard page
│   │   ├── +page.server.js    # Load app config at page level
│   │   └── api/
│   │       └── storage/
│   │           └── +server.js # GET /api/storage endpoint
│   └── static/
│       └── icons/             # Optional SVG icons for each app
└── docker/
    └── docker-compose.dashboard.yml  # Compose override or snippet
```

## Docker configuration

The dashboard container needs host filesystem access for storage stats. Here's the service definition to add to the existing compose file:

```yaml
  dashboard:
    build: ./homelab-dashboard
    container_name: homelab-dashboard
    ports:
      - "3000:3000"
    volumes:
      - /:/host:ro                          # Host root, read-only (for storage stats)
      - ./homelab-dashboard/config:/app/config  # App config (editable on host)
    environment:
      - HOST_MOUNT=/host
      - NODE_ENV=production
    restart: unless-stopped
```

The Dockerfile should:
1. Use `node:20-alpine` as base
2. Copy package files, run `npm ci`
3. Copy source, run `npm run build`
4. Expose port 3000
5. Run with `node build` (SvelteKit adapter-node output)

Use `@sveltejs/adapter-node` in `svelte.config.js` (not adapter-auto) since we're deploying in Docker.

## Design direction

- Dark theme by default (this is a homelab — it'll be accessible via the web).
- The layout need to work for a normal monitor or phone (Iphone, google pixel)
- Clean, minimal layout — no sidebar, just a single column with sections
- Header: "Homelab" title with a subtle subtitle
- Sections flow vertically: App tiles grid → Storage stats cards
- Responsive: 5 tiles across on desktop, 2-3 on mobile
- Use rounded cards with subtle borders, no heavy shadows
- Storage bars should be visually prominent — they're the main "at a glance" info

## Important notes for Claude Code

- Start by scaffolding the SvelteKit project with `npm create svelte@latest` (skeleton template, TypeScript optional — JavaScript is fine)
- Install Tailwind via `npx svelte-add tailwind` or manually
- The user's Docker Compose file may be provided separately — use the port mappings from it to populate `apps.json`
- Keep the code simple and well-commented — this is a learning project
- Prefer SvelteKit conventions (load functions, server routes) over custom patterns
- Test that `npm run build` succeeds before considering the task done
