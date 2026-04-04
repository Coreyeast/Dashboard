<script>
  import { onMount, onDestroy } from 'svelte';
  import { dndzone, SHADOW_ITEM_MARKER_PROPERTY_NAME } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import TorrentRow from './TorrentRow.svelte';

  const FLIP_MS = 200;
  const POLL_MS = 5000;

  let torrents    = null;
  let error       = null;
  let actionError = null;
  let lastUpdated = null;
  let connected   = false;
  let timeLabel   = '';
  let pollId, clockId, actionErrorId;

  // True while user is dragging — suppresses poll-driven dndItems updates
  let dragging = false;

  // Derived sections (reactive from torrents)
  $: activeItems  = torrents ? torrents.filter((t) => t.progress < 1.0)  : [];
  $: seedingItems = torrents ? torrents.filter((t) => t.progress >= 1.0) : [];

  // dndItems is the local ordered list for the drag-and-drop zone.
  // It is manually synced from server data — NOT via a reactive statement —
  // so that a drag finalize never gets overwritten by a stale re-fetch.
  let dndItems = [];

  // ── Fetch ──────────────────────────────────────────────────────────────────

  async function fetchTorrents() {
    try {
      const res  = await fetch('/api/torrents');
      const data = await res.json();
      if (!res.ok || data.error) {
        error     = data.error ?? `HTTP ${res.status}`;
        connected = false;
      } else {
        torrents    = data;
        error       = null;
        connected   = true;
        lastUpdated = new Date();
        // Only update the DND list when we are not mid-drag, so an in-flight
        // poll cannot snap the list back to server order during a drag.
        if (!dragging) {
          dndItems = data.filter((t) => t.progress < 1.0);
        }
      }
    } catch (e) {
      error     = `Network error — ${e.message}`;
      connected = false;
    }
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async function sendAction(action, hashes) {
    try {
      const res  = await fetch(`/api/torrents/${action}`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ hashes }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showActionError(data.error ?? `Action failed (HTTP ${res.status})`);
        return false;
      }
      return true;
    } catch (e) {
      showActionError(`Could not reach server — ${e.message}`);
      return false;
    }
  }

  async function dispatchAction(action, hashes) {
    await sendAction(action, hashes);
    await fetchTorrents();
  }

  function showActionError(msg) {
    actionError = msg;
    clearTimeout(actionErrorId);
    actionErrorId = setTimeout(() => (actionError = null), 4000);
  }

  function handleRowAction(e) {
    dispatchAction(e.detail.action, e.detail.hashes);
  }

  // ── Drag and drop ──────────────────────────────────────────────────────────

  function handleConsider(e) {
    dragging = true;
    dndItems = e.detail.items;
  }

  async function handleFinalize(e) {
    // Strip the DND shadow placeholder item before using the list
    const newItems  = e.detail.items.filter((t) => !t[SHADOW_ITEM_MARKER_PROPERTY_NAME]);
    const draggedId = e.detail.info.id;

    // Show the new order immediately (optimistic) — this is now the source of truth
    // until the next poll brings confirmed server data.
    dndItems = newItems;

    const newIndex = newItems.findIndex((t) => t.id === draggedId);
    const oldIndex = activeItems.findIndex((t) => t.id === draggedId);

    if (newIndex !== oldIndex) {
      const draggedItem = newItems[newIndex];

      // Auto-resume: stopped torrent dragged above a downloading item
      const hasDownloadingAbove = newItems
        .slice(0, newIndex)
        .some((t) => t.category === 'downloading');
      if (draggedItem.category === 'stopped' && hasDownloadingAbove) {
        await sendAction('resume', draggedItem.hash);
      }

      // Reorder via qBittorrent priority API
      if (newIndex === 0) {
        await sendAction('topPrio', draggedItem.hash);
      } else if (newIndex < oldIndex) {
        for (let i = 0; i < oldIndex - newIndex; i++) {
          await sendAction('increasePrio', draggedItem.hash);
        }
      } else {
        for (let i = 0; i < newIndex - oldIndex; i++) {
          await sendAction('decreasePrio', draggedItem.hash);
        }
      }
    }

    // Release drag lock. dndItems stays as the optimistic order; the next
    // poll (up to POLL_MS away, by which time qBit will have processed the
    // priority changes) will overwrite it with confirmed server data.
    dragging = false;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  onMount(() => {
    fetchTorrents();
    pollId  = setInterval(() => { if (!dragging) fetchTorrents(); }, POLL_MS);
    clockId = setInterval(() => {
      if (lastUpdated) {
        const sec = Math.round((Date.now() - lastUpdated.getTime()) / 1000);
        timeLabel = sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)}m ago`;
      }
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(pollId);
    clearInterval(clockId);
    clearTimeout(actionErrorId);
  });

  $: if (lastUpdated) {
    const sec = Math.round((Date.now() - lastUpdated.getTime()) / 1000);
    timeLabel = sec < 60 ? `${sec}s ago` : `${Math.floor(sec / 60)}m ago`;
  }
</script>

<div class="rounded-xl border border-gray-800 bg-gray-900/40">

  <!-- ── Header ─────────────────────────────────────────────────────────── -->
  <div class="flex items-center justify-between border-b border-gray-800 px-4 py-3">
    <div class="flex items-center gap-2.5">
      <span class="relative flex h-2.5 w-2.5" title={connected ? 'Connected' : 'Unreachable'}>
        {#if connected}
          <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-40"></span>
        {/if}
        <span class="relative inline-flex h-2.5 w-2.5 rounded-full {connected ? 'bg-green-500' : 'bg-red-500'}"></span>
      </span>

      <h2 class="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-gray-300">
        Downloads
      </h2>

      {#if torrents !== null && !error}
        <span class="font-mono text-[10px] text-gray-600">
          {activeItems.length} active
        </span>
      {/if}
    </div>

    <div class="flex items-center gap-3">
      {#if lastUpdated}
        <span class="font-mono text-[10px] text-gray-600">{timeLabel}</span>
      {/if}
      {#if connected}
        <button
          on:click={() => dispatchAction('pause', 'all')}
          class="rounded border border-gray-700 px-2 py-0.5 font-mono text-[10px] text-gray-400
                 transition-colors hover:border-gray-500 hover:text-gray-200"
        >pause all</button>
        <button
          on:click={() => dispatchAction('resume', 'all')}
          class="rounded border border-gray-700 px-2 py-0.5 font-mono text-[10px] text-gray-400
                 transition-colors hover:border-gray-500 hover:text-gray-200"
        >resume all</button>
      {/if}
    </div>
  </div>

  <!-- ── Body ───────────────────────────────────────────────────────────── -->
  <div class="p-3">

    {#if actionError}
      <div class="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/40
                  bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
        <span class="font-mono font-bold">!</span>
        <span class="font-mono">{actionError}</span>
      </div>
    {/if}

    {#if error}
      <div class="flex items-start gap-3 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3">
        <span class="mt-0.5 font-mono text-base font-bold text-red-400">!</span>
        <div>
          <p class="font-mono text-sm font-semibold text-red-300">qBittorrent unavailable</p>
          <p class="mt-0.5 font-mono text-xs text-red-400/70">{error}</p>
          <p class="mt-1 font-mono text-[10px] text-red-500/50">
            Check QBIT_URL / QBIT_USERNAME / QBIT_PASSWORD — retrying every 5s
          </p>
        </div>
      </div>

    {:else if torrents === null}
      <div class="flex flex-col gap-1.5">
        {#each [1, 2, 3] as _}
          <div class="h-[68px] animate-pulse rounded-lg bg-gray-800"></div>
        {/each}
      </div>

    {:else if torrents.length === 0}
      <p class="py-4 text-center font-mono text-xs text-gray-600">No active torrents</p>

    {:else}

      <!-- ── Active download queue (drag-and-drop) ── -->
      {#if dndItems.length > 0}
        <div
          use:dndzone={{ items: dndItems, flipDurationMs: FLIP_MS, type: 'torrents' }}
          on:consider={handleConsider}
          on:finalize={handleFinalize}
          class="flex flex-col gap-1"
        >
          {#each dndItems as torrent, i (torrent.id)}
            <div animate:flip={{ duration: FLIP_MS }}>
              <TorrentRow
                {torrent}
                isFirst={i === 0}
                isLast={i === dndItems.length - 1}
                isSeeding={false}
                on:action={handleRowAction}
              />
            </div>
          {/each}
        </div>
      {/if}

      <!-- ── Recently seeded divider + section ── -->
      {#if seedingItems.length > 0}
        <div class="my-3 flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-800"></div>
          <span class="font-mono text-[10px] uppercase tracking-widest text-gray-700">
            recently seeded
          </span>
          <div class="h-px flex-1 bg-gray-800"></div>
        </div>

        <div class="flex flex-col gap-1 opacity-70">
          {#each seedingItems as torrent (torrent.id)}
            <TorrentRow
              {torrent}
              isSeeding={true}
              isFirst={false}
              isLast={false}
              on:action={handleRowAction}
            />
          {/each}
        </div>
      {/if}

    {/if}
  </div>
</div>
