<script>
  import { onMount, onDestroy } from 'svelte';
  import TorrentRow from './TorrentRow.svelte';

  let torrents = null;
  let error = null;
  let actionError = null;   // transient error shown after a failed button action
  let lastUpdated = null;
  let connected = false;
  let timeLabel = '';
  let pollId, clockId, actionErrorId;

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------

  async function fetchTorrents() {
    try {
      const res = await fetch('/api/torrents');
      const data = await res.json();
      if (!res.ok || data.error) {
        error = data.error ?? `HTTP ${res.status}`;
        connected = false;
      } else {
        torrents = data;
        error = null;
        connected = true;
        lastUpdated = new Date();
      }
    } catch (e) {
      error = `Network error — ${e.message}`;
      connected = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function dispatchAction(action, hashes) {
    try {
      const res = await fetch(`/api/torrents/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashes }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showActionError(data.error ?? `Action failed (HTTP ${res.status})`);
      }
    } catch (e) {
      showActionError(`Could not reach server — ${e.message}`);
    }
    // Refresh to reflect the new state regardless of success/failure
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

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  onMount(() => {
    fetchTorrents();
    pollId  = setInterval(fetchTorrents, 5000);
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
      <!-- Animated connection dot -->
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
          {torrents.length} torrent{torrents.length !== 1 ? 's' : ''}
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
  <div class="p-4">

    <!-- Action error toast -->
    {#if actionError}
      <div class="mb-3 flex items-center gap-2 rounded-lg border border-amber-500/40
                  bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
        <span class="font-mono font-bold">!</span>
        <span class="font-mono">{actionError}</span>
      </div>
    {/if}

    <!-- Connection error -->
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

    <!-- First-load skeleton -->
    {:else if torrents === null}
      <div class="flex flex-col gap-2">
        {#each [1, 2, 3] as _}
          <div class="h-[68px] animate-pulse rounded-lg bg-gray-800"></div>
        {/each}
      </div>

    <!-- Empty -->
    {:else if torrents.length === 0}
      <p class="py-4 text-center font-mono text-xs text-gray-600">No active torrents</p>

    <!-- Torrent rows -->
    {:else}
      <div class="flex flex-col gap-1.5">
        {#each torrents as torrent (torrent.hash)}
          <TorrentRow {torrent} on:action={handleRowAction} />
        {/each}
      </div>
    {/if}

  </div>
</div>
