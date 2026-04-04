import { json } from '@sveltejs/kit';
import { fetchTransferInfo, fetchTorrents, formatSpeed, formatSize } from '$lib/server/qbit.js';

// States that count as "inactive" for the active-tasks counter
const INACTIVE = new Set([
  'stoppedDL', 'stoppedUP',
  'pausedDL',  'pausedUP',
  'error', 'missingFiles', 'unknown',
]);

/** GET /api/stats — live speeds, active task count, and free disk space from qBittorrent. */
export async function GET() {
  try {
    const [transfer, torrents] = await Promise.all([
      fetchTransferInfo(),
      fetchTorrents(),
    ]);

    const activeTasks = torrents.filter((t) => !INACTIVE.has(t.state)).length;

    return json({
      dlSpeed:       formatSpeed(transfer.dl_info_speed),
      dlSpeedRaw:    transfer.dl_info_speed,
      upSpeed:       formatSpeed(transfer.up_info_speed),
      upSpeedRaw:    transfer.up_info_speed,
      activeTasks,
      freeSpace:     formatSize(transfer.free_space_on_disk ?? 0),
      freeSpaceRaw:  transfer.free_space_on_disk ?? 0,
    });
  } catch (err) {
    console.error('[/api/stats]', err.message);
    return json({ error: 'unavailable' }, { status: 503 });
  }
}
