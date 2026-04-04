import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Host root is bind-mounted here inside the container (rslave propagation exposes submounts)
const HOST = (process.env.HOST_MOUNT ?? '/host').replace(/\/$/, '');

// Cache results for 60 s — du on large media dirs can be slow
let cache   = null;
let cacheAt = 0;
const CACHE_TTL = 60_000;

// Logical paths on the host (no HOST prefix — we add it when running commands)
const DIRS = [
  { label: 'Shows',      path: '/data/shows' },
  { label: 'Movies',     path: '/data/movies' },
  { label: 'Completed',  path: '/data/downloads/qbittorrent/completed' },
  { label: 'Incomplete', path: '/data/downloads/qbittorrent/incomplete' },
];

function fmtBytes(b) {
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 ** 3) return `${(b / 1024 ** 2).toFixed(1)} MB`;
  if (b < 1024 ** 4) return `${(b / 1024 ** 3).toFixed(2)} GB`;
  return `${(b / 1024 ** 4).toFixed(2)} TB`;
}

/**
 * Parse `df -B1 <path>` stdout.
 * The mount point shown by df will include the HOST prefix (e.g. /host/data).
 * We strip it so the client sees clean paths (/, /data).
 */
function parseDf(stdout) {
  const line  = stdout.trim().split('\n')[1].trim().split(/\s+/);
  const total = parseInt(line[1], 10);
  const used  = parseInt(line[2], 10);
  const avail = parseInt(line[3], 10);
  const raw   = line[5];
  // Normalise: /host/data → /data, /host → /
  const mount = raw.startsWith(HOST) ? (raw.slice(HOST.length) || '/') : raw;
  return {
    mount,
    total, used, avail,
    pct:      Math.round((used / total) * 100),
    totalFmt: fmtBytes(total),
    usedFmt:  fmtBytes(used),
    availFmt: fmtBytes(avail),
  };
}

/** Run `du -sb` on a single directory inside the host mount; returns 0 bytes on failure. */
async function duDir({ label, path }) {
  const hostPath = `${HOST}${path}`;
  try {
    const { stdout } = await execAsync(`du -sb "${hostPath}"`, { timeout: 30_000 });
    const bytes = parseInt(stdout.split('\t')[0], 10);
    return { label, path, bytes, size: fmtBytes(bytes) };
  } catch {
    return { label, path, bytes: 0, size: '—' };
  }
}

async function collect() {
  const [rootPart, dataPart, ...dirs] = await Promise.all([
    execAsync(`df -B1 "${HOST}"`).then((r) => parseDf(r.stdout)).catch(() => null),
    execAsync(`df -B1 "${HOST}/data"`).then((r) => parseDf(r.stdout)).catch(() => null),
    ...DIRS.map(duDir),
  ]);

  return {
    partitions:  [rootPart, dataPart].filter(Boolean),
    directories: dirs,
  };
}

/** GET /api/disk — partition stats and directory usage breakdown. */
export async function GET() {
  if (cache && Date.now() - cacheAt < CACHE_TTL) return json(cache);

  try {
    const data = await collect();
    cache  = data;
    cacheAt = Date.now();
    return json(data);
  } catch (err) {
    console.error('[/api/disk]', err.message);
    if (cache) return json(cache);
    return json({ error: 'unavailable' }, { status: 503 });
  }
}
