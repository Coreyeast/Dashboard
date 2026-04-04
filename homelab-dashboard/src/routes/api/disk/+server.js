import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Cache results for 60 s — du on large media dirs can be slow
let cache    = null;
let cacheAt  = 0;
const CACHE_TTL = 60_000;

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

/** Parse `df -B1 <path>` stdout into a partition object. */
function parseDf(stdout) {
  const line = stdout.trim().split('\n')[1].trim().split(/\s+/);
  const total = parseInt(line[1], 10);
  const used  = parseInt(line[2], 10);
  const avail = parseInt(line[3], 10);
  return {
    mount:     line[5],
    total,     used,   avail,
    pct:       Math.round((used / total) * 100),
    totalFmt:  fmtBytes(total),
    usedFmt:   fmtBytes(used),
    availFmt:  fmtBytes(avail),
  };
}

/** Run `du -sb` on a single directory; returns 0 bytes on failure (dir may not exist). */
async function duDir({ label, path }) {
  try {
    const { stdout } = await execAsync(`du -sb "${path}"`, { timeout: 30_000 });
    const bytes = parseInt(stdout.split('\t')[0], 10);
    return { label, path, bytes, size: fmtBytes(bytes) };
  } catch {
    return { label, path, bytes: 0, size: '—' };
  }
}

async function collect() {
  const [rootPart, dataPart, ...dirs] = await Promise.all([
    execAsync('df -B1 /').then((r) => parseDf(r.stdout)).catch(() => null),
    execAsync('df -B1 /data').then((r) => parseDf(r.stdout)).catch(() => null),
    ...DIRS.map(duDir),
  ]);

  return {
    partitions:  [rootPart, dataPart].filter(Boolean),
    directories: dirs,
  };
}

/** GET /api/disk — partition stats and directory usage breakdown. */
export async function GET() {
  // Serve fresh cache if still valid
  if (cache && Date.now() - cacheAt < CACHE_TTL) return json(cache);

  try {
    const data = await collect();
    cache  = data;
    cacheAt = Date.now();
    return json(data);
  } catch (err) {
    console.error('[/api/disk]', err.message);
    if (cache) return json(cache);           // return stale rather than error
    return json({ error: 'unavailable' }, { status: 503 });
  }
}
