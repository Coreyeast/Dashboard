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

// qBittorrent v5 renamed pause→stop and resume→start.
// We translate before hitting the API so the rest of the codebase stays clean.
const ACTION_MAP = {
  pause:  'stop',
  resume: 'start',
};

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
 * Returns transfer/speed info from qBittorrent (dl speed, up speed, free space).
 * @returns {Promise<object>}
 */
export async function fetchTransferInfo() {
  const res = await request('/api/v2/transfer/info');
  if (!res.ok) throw new Error(`Failed to fetch transfer info: ${res.status}`);
  return res.json();
}

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
  const apiAction = ACTION_MAP[action] ?? action;

  const res = await request(`/api/v2/torrents/${apiAction}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) throw new Error(`Torrent action "${action}" (→ ${apiAction}) failed: ${res.status}`);
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
 * Maps qBittorrent state strings into one of 6 display categories.
 *
 * Categories: 'downloading' | 'stalled' | 'stopped' | 'queued' | 'seeding' | 'error'
 *
 * Key distinction: 'stalled' = trying but no peers; 'stopped' = user explicitly paused.
 */
export function classifyState(state) {
  switch (state) {
    case 'downloading':
    case 'forcedDL':
    case 'checkingDL':
      return { label: 'Downloading', category: 'downloading' };

    case 'stalledDL':
      return { label: 'Stalled', category: 'stalled' };

    case 'pausedDL':
    case 'pausedUP':
    case 'stoppedDL':   // qBittorrent v5+ renamed pausedDL → stoppedDL
    case 'stoppedUP':   // qBittorrent v5+ renamed pausedUP → stoppedUP
      return { label: 'Stopped', category: 'stopped' };

    case 'queuedDL':
    case 'queuedUP':
    case 'moving':
      return { label: 'Queued', category: 'queued' };

    case 'uploading':
    case 'stalledUP':
    case 'forcedUP':
    case 'checkingUP':
      return { label: 'Seeding', category: 'seeding' };

    case 'missingFiles':
    case 'error':
    case 'unknown':
    default:
      return { label: 'Error', category: 'error' };
  }
}

// ---------------------------------------------------------------------------
// Auto-seeding management
// ---------------------------------------------------------------------------

/**
 * Track hashes that had progress < 1.0 on the previous poll so we can detect
 * the moment a torrent finishes downloading (transitions to progress === 1.0).
 */
let prevInProgress = new Set();

/**
 * Runs every time torrents are fetched. When a download completes:
 *  1. Pause any torrent that is actively seeding (uploading/forcedUP).
 *  2. The newly-completed torrent will naturally start seeding on its own.
 *
 * @param {object[]} raw — raw qBit torrent list
 */
export async function autoManageSeeding(raw) {
  // Build current set of in-progress hashes (progress < 1.0)
  const currentInProgress = new Set(
    raw.filter((t) => t.progress < 1.0).map((t) => t.hash)
  );

  // Hashes that were in-progress last poll but now have progress === 1.0
  const newlyCompleted = [...prevInProgress].filter((hash) => {
    if (currentInProgress.has(hash)) return false; // still in progress
    const t = raw.find((r) => r.hash === hash);
    return t && t.progress >= 1.0; // confirmed complete (not just removed)
  });

  prevInProgress = currentInProgress;

  if (newlyCompleted.length === 0) return;

  // Pause any torrent that is currently actively seeding
  const activeSeeders = raw.filter(
    (t) =>
      (t.state === 'uploading' || t.state === 'forcedUP') &&
      !newlyCompleted.includes(t.hash)
  );

  for (const t of activeSeeders) {
    try { await actionTorrent('pause', t.hash); } catch { /* best-effort */ }
  }
}

// ---------------------------------------------------------------------------
// Transform + filter for display
// ---------------------------------------------------------------------------

/**
 * Transform the raw qBit list into browser-safe objects, then filter:
 *   - All torrents with progress < 1.0 (anything not fully downloaded)
 *   - The 3 most recently completed torrents (by completion_on, descending)
 *
 * Active queue items are sorted by qBit priority (ascending, 0 goes last).
 * Completed items are appended at the end.
 *
 * Each item gets an `id` field (= hash) for svelte-dnd-action compatibility.
 *
 * @param {object[]} raw
 * @returns {object[]}
 */
export function transformTorrents(raw) {
  const mapped = raw.map((t) => {
    const { label, category } = classifyState(t.state);
    const isDownloading = category === 'downloading' || category === 'stalled';
    const isSeeding = category === 'seeding';
    const isActive = isDownloading || isSeeding;

    return {
      id: t.hash,          // required by svelte-dnd-action
      hash: t.hash,
      name: t.name,
      progress: t.progress,
      progressPct: `${(t.progress * 100).toFixed(1)}%`,
      state: t.state,
      category,
      statusLabel: label,
      priority: t.priority ?? 0,
      size: formatSize(t.size),
      dlSpeed: isDownloading ? formatSpeed(t.dlspeed) : null,
      upSpeed: isSeeding ? formatSpeed(t.upspeed) : null,
      eta: isDownloading ? formatEta(t.eta) : null,
      ratio: t.ratio.toFixed(2),
      completedAt: t.completion_on && t.completion_on > 0 ? t.completion_on : (t.added_on ?? 0),
    };
  });

  // All incomplete torrents (the download queue)
  const incomplete = mapped
    .filter((t) => t.progress < 1.0)
    .sort((a, b) => {
      // Sort by qBit priority: 0 = not queued (put at bottom), otherwise ascending
      if (a.priority === 0 && b.priority === 0) return a.name.localeCompare(b.name);
      if (a.priority === 0) return 1;
      if (b.priority === 0) return -1;
      return a.priority - b.priority;
    });

  // 3 most recently completed (seeding queue)
  const recentCompleted = mapped
    .filter((t) => t.progress >= 1.0)
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 3);

  return [...incomplete, ...recentCompleted];
}
