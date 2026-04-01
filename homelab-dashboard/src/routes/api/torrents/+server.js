import { json } from '@sveltejs/kit';
import { fetchTorrents, transformTorrents, autoManageSeeding } from '$lib/server/qbit.js';

/** GET /api/torrents — returns the filtered, transformed torrent list as JSON. */
export async function GET() {
  try {
    const raw = await fetchTorrents();

    // Side-effect: enforce the "newest download gets to seed first" policy.
    // Runs async best-effort — we don't await it so it doesn't slow the response.
    autoManageSeeding(raw).catch((err) =>
      console.error('[autoManageSeeding]', err.message)
    );

    return json(transformTorrents(raw));
  } catch (err) {
    console.error('[/api/torrents]', err.message);
    return json({ error: 'qBittorrent unavailable' }, { status: 503 });
  }
}
