import { json } from '@sveltejs/kit';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fetchTransferInfo, fetchTorrents, formatSpeed, formatSize } from '$lib/server/qbit.js';

const execAsync = promisify(exec);

// States that count as "inactive" for the active-tasks counter
const INACTIVE = new Set([
  'stoppedDL', 'stoppedUP',
  'pausedDL',  'pausedUP',
  'error', 'missingFiles', 'unknown',
]);

/** Get free bytes on /data from df, falling back to null on any error. */
async function getDataFreeBytes() {
  const host = (process.env.HOST_MOUNT ?? '/host').replace(/\/$/, '');
  try {
    const { stdout } = await execAsync(`df -B1 "${host}/data"`);
    const cols = stdout.trim().split('\n')[1].trim().split(/\s+/);
    return parseInt(cols[3], 10);
  } catch {
    return null;
  }
}

/** GET /api/stats — live speeds, active task count, and free disk space. */
export async function GET() {
  try {
    const [transfer, torrents, freeBytes] = await Promise.all([
      fetchTransferInfo(),
      fetchTorrents(),
      getDataFreeBytes(),
    ]);

    const activeTasks  = torrents.filter((t) => !INACTIVE.has(t.state)).length;
    const freeBytesVal = freeBytes ?? transfer.free_space_on_disk ?? 0;

    return json({
      dlSpeed:      formatSpeed(transfer.dl_info_speed),
      dlSpeedRaw:   transfer.dl_info_speed,
      upSpeed:      formatSpeed(transfer.up_info_speed),
      upSpeedRaw:   transfer.up_info_speed,
      activeTasks,
      freeSpace:    formatSize(freeBytesVal),
      freeSpaceRaw: freeBytesVal,
    });
  } catch (err) {
    console.error('[/api/stats]', err.message);
    return json({ error: 'unavailable' }, { status: 503 });
  }
}
