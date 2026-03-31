# Phase 2 — qBittorrent live torrent module

## Context

This is an existing SvelteKit + Tailwind CSS dashboard running in Docker. Phase 1 is complete with app tiles and host storage stats. The project lives at `./homelab-dashboard/` and uses `@sveltejs/adapter-node`.

Do NOT recreate the project or modify existing phase 1 features. Add to the existing codebase.

## Goal

Add a live torrent module to the dashboard that shows all torrents from qBittorrent with real-time status updates and basic controls (pause, resume, prioritise).

## Environment variables

The following env vars will be available at runtime (set via `.env` file and Docker Compose, never hardcoded):

```
QBIT_URL=http://192.168.1.100:8080
QBIT_USERNAME=ceast
QBIT_PASSWORD=Yeroc822
```

Access these via `process.env.QBIT_URL` etc. in server-side code only.

**IMPORTANT:** Never expose credentials or the qBit URL to the browser. All qBit API calls happen server-side in SvelteKit server routes.

## qBittorrent Web API reference

### Authentication

```
POST {QBIT_URL}/api/v2/auth/login
Content-Type: application/x-www-form-urlencoded
Body: username={QBIT_USERNAME}&password={QBIT_PASSWORD}

Response: sets SID cookie on success, returns "Ok." as body text
```

The SID cookie expires after ~30 minutes of inactivity. The server should store this cookie in memory and re-authenticate automatically on 403 responses.

### List torrents

```
GET {QBIT_URL}/api/v2/torrents/info

Response: JSON array of torrent objects
```

Key fields per torrent:
- `hash` (string) — unique identifier, use this for all actions
- `name` (string) — torrent name
- `progress` (float) — 0.0 to 1.0
- `dlspeed` (int) — download speed in bytes/sec
- `upspeed` (int) — upload speed in bytes/sec
- `eta` (int) — seconds remaining, 8640000 means infinity/unknown
- `state` (string) — see states below
- `size` (int) — total size in bytes
- `priority` (int) — queue priority (0 = not queued)
- `ratio` (float) — share ratio
- `added_on` (int) — unix timestamp
- `category` (string) — category label

Torrent states: `downloading`, `pausedDL`, `stalledDL`, `queuedDL`, `uploading`, `pausedUP`, `stalledUP`, `queuedUP`, `checkingDL`, `checkingUP`, `moving`, `forcedDL`, `forcedUP`, `missingFiles`, `error`, `unknown`

### Torrent actions

All actions use POST with `Content-Type: application/x-www-form-urlencoded`.

```
POST /api/v2/torrents/pause      body: hashes={hash}
POST /api/v2/torrents/resume     body: hashes={hash}
POST /api/v2/torrents/topPrio    body: hashes={hash}
POST /api/v2/torrents/bottomPrio body: hashes={hash}
POST /api/v2/torrents/increasePrio body: hashes={hash}
POST /api/v2/torrents/decreasePrio body: hashes={hash}
```

Multiple hashes can be pipe-separated: `hashes=abc|def|ghi`
Use `hashes=all` to affect all torrents.

## What to build

### Backend — SvelteKit server routes

#### `src/lib/server/qbit.js` — qBittorrent API client

A server-side module that handles:
- Authenticating with qBit and storing the SID cookie in memory
- Auto re-auth on 403 (cookie expired)
- A `fetchTorrents()` function that returns the parsed torrent list
- An `actionTorrent(hash, action)` function for pause/resume/priority
- Formatting helper: convert bytes/sec to human-readable speeds, bytes to GB, ETA seconds to "2h 15m" format

Keep it simple — this is a single module with exported functions, not a class.

#### `src/routes/api/torrents/+server.js` — GET endpoint

- Calls `fetchTorrents()` from the qbit module
- Returns JSON array to the browser
- If qBit is unreachable, return `{ error: "qBittorrent unavailable" }` with a 503 status

#### `src/routes/api/torrents/[action]/+server.js` — POST endpoint

- Accepts `{ hashes: "abc123" }` in the request body
- `[action]` matches: `pause`, `resume`, `topPrio`, `bottomPrio`, `increasePrio`, `decreasePrio`
- Calls `actionTorrent()` from the qbit module
- Returns `{ success: true }` or `{ error: "..." }`

### Frontend — Svelte components

#### `src/lib/components/TorrentList.svelte` — main module

- On mount, fetch `/api/torrents` and start a 5-second polling interval
- Clear the interval on destroy
- Display a table/list of torrents, sorted by: active downloads first, then queued, then seeding, then paused
- Show a "qBittorrent unavailable" message if the API returns an error (don't crash the whole dashboard)

#### Each torrent row should display:

- **Name** — truncated if long, full name in a tooltip/title attribute
- **Status badge** — colour-coded pill showing the state:
  - Downloading (green), Seeding/uploading (blue), Paused (gray), Stalled (amber), Error (red)
  - Simplify the many qBit states into these 5 display categories
- **Progress bar** — filled proportionally, colour matches status
- **Progress percentage** — e.g. "73.2%"
- **Download speed** — e.g. "5.2 MB/s" (only show when downloading)
- **Upload speed** — e.g. "1.0 MB/s" (only show when active)
- **ETA** — e.g. "2h 15m" or "∞" if 8640000 (only show when downloading)
- **Size** — e.g. "4.3 GB"

#### Controls per torrent row:

- **Pause/Resume toggle** — single button that switches based on current state
- **Priority up/down** — two small buttons to increase/decrease queue priority
- Show controls on hover or always visible on mobile

#### Global controls (above the list):

- **Pause all / Resume all** — uses `hashes=all`
- **Connection status indicator** — small dot showing green (connected) or red (disconnected)
- **Last updated timestamp** — e.g. "Updated 3s ago"

### Integration with existing dashboard

- Import `TorrentList` in `src/routes/+page.svelte`
- Add it as a new section below the existing storage stats panel
- Use a section label consistent with the existing design ("Downloads" or "Torrents")
- The module should gracefully handle qBit being unavailable without breaking the rest of the dashboard — wrap it in an error boundary or conditional

## File changes summary

New files:
```
src/lib/server/qbit.js
src/lib/components/TorrentList.svelte
src/lib/components/TorrentRow.svelte
src/routes/api/torrents/+server.js
src/routes/api/torrents/[action]/+server.js
```

Modified files:
```
src/routes/+page.svelte          (add TorrentList section)
```

## Docker changes

Add these environment variables to the dashboard service in compose:

```yaml
environment:
  - QBIT_URL=${QBIT_URL}
  - QBIT_USERNAME=${QBIT_USERNAME}
  - QBIT_PASSWORD=${QBIT_PASSWORD}
```

Create a `.env.example` file in the project root (committed to git) as a template:
```
QBIT_URL=http://localhost:8080
QBIT_USERNAME=admin
QBIT_PASSWORD=changeme
```

Add `.env` to `.gitignore` if not already present.

## Design guidance

- Match the existing dark theme and card styling from phase 1
- Torrent rows should be compact — this list could have 20+ items
- Progress bars should be thin (6-8px) and colour-coded by status
- Controls should be subtle (small icon buttons) not large CTA buttons
- Use monospace font for speeds and sizes for easy scanning
- The whole module should feel like a monitoring panel, not a full torrent client
- Add a subtle loading skeleton or spinner on initial load

## Testing

- Run `npm run build` to confirm no build errors
- Test with qBit credentials set in `.env`
- Test with qBit unavailable (wrong URL) — dashboard should still load with an error message in the torrent section
- Test pause/resume on a real torrent
- Confirm credentials never appear in browser network tab or page source
