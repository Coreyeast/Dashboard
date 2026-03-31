import { json } from '@sveltejs/kit';
import { actionTorrent } from '$lib/server/qbit.js';

// Whitelist kept here too as a defence-in-depth check — qbit.js also validates.
const VALID_ACTIONS = new Set([
  'pause',
  'resume',
  'topPrio',
  'bottomPrio',
  'increasePrio',
  'decreasePrio',
]);

/**
 * POST /api/torrents/:action
 *
 * Body (JSON): { hashes: "abc123def456" | "abc|def" | "all" }
 */
export async function POST({ params, request }) {
  const { action } = params;

  if (!VALID_ACTIONS.has(action)) {
    return json({ error: `Unknown action: ${action}` }, { status: 400 });
  }

  let hashes;
  try {
    const body = await request.json();
    hashes = body?.hashes;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!hashes || typeof hashes !== 'string') {
    return json({ error: 'Missing or invalid "hashes" field' }, { status: 400 });
  }

  try {
    await actionTorrent(action, hashes);
    return json({ success: true });
  } catch (err) {
    console.error(`[/api/torrents/${action}]`, err.message);
    return json({ error: 'qBittorrent unavailable' }, { status: 503 });
  }
}
