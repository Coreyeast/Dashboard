import { json } from '@sveltejs/kit';
import { fetchTorrents, transformTorrents } from '$lib/server/qbit.js';

/** GET /api/torrents — returns the transformed torrent list as JSON. */
export async function GET() {
  try {
    const raw = await fetchTorrents();
    return json(transformTorrents(raw));
  } catch (err) {
    console.error('[/api/torrents]', err.message);
    return json({ error: 'qBittorrent unavailable' }, { status: 503 });
  }
}
