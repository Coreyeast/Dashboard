/**
 * qBittorrent Web API client — server-side only.
 *
 * Credentials are read exclusively from environment variables and never
 * sent to the browser. All functions in this module must only be imported
 * from SvelteKit server files (+server.js, +page.server.js, etc.).
 *
 * Auth strategy: store the SID cookie in memory. On a 403 response the
 * session has expired — re-authenticate once and retry.
 */

// In-memory session — persists for the lifetime of the Node.js process.
let sid = null;

// Actions the client is allowed to dispatch (whitelist).
const VALID_ACTIONS = new Set([
  'pause',
  'resume',
  'topPrio',
  'bottomPrio',
  'increasePrio',
  'decreasePrio',
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function baseUrl() {
  const url = process.env.QBIT_URL;
  if (!url) throw new Error('QBIT_URL environment variable is not set');
  return url.replace(/\/$/, ''); // strip trailing slash
}

async function login() {
  const body = new URLSearchParams({
    username: process.env.QBIT_USERNAME ?? '',
    password: process.env.QBIT_PASSWORD ?? '',
  });

  const res = await fetch(`${baseUrl()}/api/v2/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`qBit login HTTP error: ${res.status}`);

  const text = await res.text();
  if (text.trim() !== 'Ok.') throw new Error(`qBit login rejected: "${text}"`);

  // Parse the SID cookie from the response header.
  const setCookie = res.headers.get('set-cookie') ?? '';
  const match = setCookie.match(/SID=([^;]+)/);
  if (!match) throw new Error('qBit login succeeded but no SID cookie was returned');

  sid = match[1];
}

/**
 * Make an authenticated request to the qBit API.
 * Automatically re-authenticates once on a 403 (expired session).
 */
async function request(path, options = {}, isRetry = false) {
  if (!sid) await login();

  const res = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      ...options.headers,
      Cookie: `SID=${sid}`,
    },
  });

  if (res.status === 403 && !isRetry) {
    // Session expired — re-auth and try once more.
    sid = null;
    await login();
    return request(path, options, true);
  }

  return res;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the raw torrent list from qBittorrent.
 * @returns {Promise<object[]>}
 */
export async function fetchTorrents() {
  const res = await request('/api/v2/torrents/info');
  if (!res.ok) throw new Error(`Failed to fetch torrents: ${res.status}`);
  return res.json();
}

/**
 * Dispatch a torrent action (pause, resume, priority changes).
 *
 * @param {string} action - One of the VALID_ACTIONS values.
 * @param {string} hashes - Pipe-separated torrent hashes, or "all".
 */
export async function actionTorrent(action, hashes) {
  if (!VALID_ACTIONS.has(action)) {
    throw new Error(`Invalid torrent action: "${action}"`);
  }

  const body = new URLSearchParams({ hashes });

  const res = await request(`/api/v2/torrents/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Torrent action "${action}" failed: ${res.status}`);
}

// ---------------------------------------------------------------------------
// Formatting helpers (used server-side before sending JSON to the client)
// ---------------------------------------------------------------------------

/** Converts bytes/sec to a human-readable speed string. */
export function formatSpeed(bytesPerSec) {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`;
  if (bytesPerSec < 1024 ** 2) return `${(bytesPerSec / 1024).toFixed(1)} KB/s`;
  return `${(bytesPerSec / 1024 ** 2).toFixed(1)} MB/s`;
}

/** Converts bytes to a human-readable size string. */
export function formatSize(bytes) {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

/**
 * Converts ETA seconds to a short string.
 * qBittorrent uses 8640000 to indicate "unknown / infinity".
 */
export function formatEta(seconds) {
  if (seconds >= 8640000) return '∞';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Maps the many qBittorrent state strings into one of 5 display categories.
 * Returns { label, category } where category is used for colour coding.
 *
 * Categories: 'downloading' | 'seeding' | 'paused' | 'stalled' | 'error'
 */
export function classifyState(state) {
  switch (state) {
    case 'downloading':
    case 'forcedDL':
    case 'checkingDL':
      return { label: 'Downloading', category: 'downloading' };

    case 'uploading':
    case 'forcedUP':
    case 'checkingUP':
      return { label: 'Seeding', category: 'seeding' };

    case 'pausedDL':
    case 'pausedUP':
      return { label: 'Paused', category: 'paused' };

    case 'stalledDL':
    case 'queuedDL':
    case 'stalledUP':
    case 'queuedUP':
    case 'moving':
      return { label: 'Stalled', category: 'stalled' };

    case 'missingFiles':
    case 'error':
    case 'unknown':
    default:
      return { label: 'Error', category: 'error' };
  }
}

/** Sort order weight — lower = shown first. */
const SORT_ORDER = { downloading: 0, stalled: 1, seeding: 2, paused: 3, error: 4 };

/**
 * Transform and sort the raw qBit torrent list into a shape safe to send
 * to the browser (no sensitive fields, pre-formatted strings).
 *
 * @param {object[]} raw
 * @returns {object[]}
 */
export function transformTorrents(raw) {
  return raw
    .map((t) => {
      const { label, category } = classifyState(t.state);
      const isPaused = category === 'paused';
      const isDownloading = category === 'downloading';
      const isActive = isDownloading || category === 'seeding';

      return {
        hash: t.hash,
        name: t.name,
        progress: t.progress,          // 0.0 – 1.0
        progressPct: `${(t.progress * 100).toFixed(1)}%`,
        state: t.state,
        category,
        statusLabel: label,
        size: formatSize(t.size),
        dlSpeed: isDownloading ? formatSpeed(t.dlspeed) : null,
        upSpeed: isActive ? formatSpeed(t.upspeed) : null,
        eta: isDownloading ? formatEta(t.eta) : null,
        ratio: t.ratio.toFixed(2),
        isPaused,
        sortWeight: SORT_ORDER[category] ?? 99,
      };
    })
    .sort((a, b) => a.sortWeight - b.sortWeight || a.name.localeCompare(b.name));
}
