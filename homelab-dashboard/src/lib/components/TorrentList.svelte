<script>
  import { onMount, onDestroy } from 'svelte';
  import TorrentRow from './TorrentRow.svelte';

  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------

  /** @type {object[] | null} null = still loading for the first time */
  let torrents = null;
  let error = null;
  let lastUpdated = null;
  let connected = false;
  let intervalId;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  async function fetchTorrents() {
    try {
      const res = await fetch('/api/torrents');
      const data = await res.json();

      if (!res.ok || data.error) {
        error = data.error ?? 'Unexpected error';
        connected = false;
      } else {
        torrents = data;
        error = null;
        connected = true;
        lastUpdated = new Date();
      }
    } catch {
      error = 'Could not reach the dashboard API';
      connected = false;
    }
  }

  onMount(() => {
    fetchTorrents();
    intervalId = setInterval(fetchTorrents, 5000);
  });

  onDestroy(() => {
    clearInterval(intervalId);
  });

  // ---------------------------------------------------------------------------
  // Controls
  // ---------------------------------------------------------------------------

  async function dispatchAction(action, hashes) {
    await fetch(`/api/torrents/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hashes }),
    });
    // Refresh immediately so the UI feels snappy.
    await fetchTorrents();
  }

  function handleRowAction(event) {
    const { action, hashes } = event.detail;
    dispatchAction(action, hashes);
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Human-readable "Xs ago" label for the last-updated timestamp. */
  function timeSince(date) {
    const sec = Math.round((Date.now() - date.getTime()) / 1000);
    if (sec < 60) return `${sec}s ago`;
    return `${Math.floor(sec / 60)}m ago`;
  }

  // Reactive timestamp label — re-evaluated every second by a secondary interval.
  let timeLabel = '';
  let clockId;
  $: if (lastUpdated) {
    timeLabel = timeSince(lastUpdated);
  }

  onMount(() => {
    clockId = setInterval(() => {
      if (lastUpdated) timeLabel = timeSince(lastUpdated);
    }, 1000);
  });

  onDestroy(() => {
    clearInterval(clockId);
  });
</script>

<section>
  <!-- Section header -->
  <div class="mb-4 flex items-center justify-between">
    <h2 class="text-xs font-semibold uppercase tracking-widest text-gray-500">Downloads</h2>

    <div class="flex items-center gap-3">
      <!-- Last updated -->
      {#if lastUpdated}
        <span class="text-xs text-gray-600">Updated {timeLabel}</span>
      {/if}

      <!-- Connection indicator -->
      <span
        class="h-2 w-2 rounded-full transition-colors {connected ? 'bg-green-500' : 'bg-red-500'}"
        title={connected ? 'Connected to qBittorrent' : 'qBittorrent unreachable'}
      ></span>
    </div>
  </div>

  <!-- Global controls -->
  {#if connected}
    <div class="mb-3 flex gap-2">
      <button
        on:click={() => dispatchAction('pause', 'all')}
        class="rounded-md border border-gray-700 px-3 py-1 text-xs text-gray-400
               hover:border-gray-500 hover:text-gray-200 transition-colors"
      >Pause all</button>
      <button
        on:click={() => dispatchAction('resume', 'all')}
        class="rounded-md border border-gray-700 px-3 py-1 text-xs text-gray-400
               hover:border-gray-500 hover:text-gray-200 transition-colors"
      >Resume all</button>
    </div>
  {/if}

  <!-- Error state -->
  {#if error}
    <div class="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-400">
      {error}
    </div>

  <!-- Loading skeleton — shown on first load only -->
  {:else if torrents === null}
    <div class="flex flex-col gap-2">
      {#each [1, 2, 3] as _}
        <div class="h-16 animate-pulse rounded-lg bg-gray-800/60"></div>
      {/each}
    </div>

  <!-- Empty state -->
  {:else if torrents.length === 0}
    <p class="text-sm text-gray-600">No torrents found.</p>

  <!-- Torrent list -->
  {:else}
    <div class="flex flex-col gap-1.5">
      {#each torrents as torrent (torrent.hash)}
        <TorrentRow {torrent} on:action={handleRowAction} />
      {/each}
    </div>
  {/if}
</section>
