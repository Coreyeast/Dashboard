<script>
  /**
   * Displays a single torrent row.
   * The parent (TorrentList) handles all API calls — this component only
   * emits events so it stays simple and testable.
   */

  /** @type {object} torrent — pre-formatted object from /api/torrents */
  export let torrent;

  // Dispatched events: 'action' with { action, hashes }
  import { createEventDispatcher } from 'svelte';
  const dispatch = createEventDispatcher();

  function send(action) {
    dispatch('action', { action, hashes: torrent.hash });
  }

  // Colour maps by category
  const barColor = {
    downloading: 'bg-green-500',
    seeding:     'bg-blue-500',
    paused:      'bg-gray-500',
    stalled:     'bg-amber-500',
    error:       'bg-red-500',
  };

  const badgeColor = {
    downloading: 'bg-green-500/15 text-green-400',
    seeding:     'bg-blue-500/15 text-blue-400',
    paused:      'bg-gray-500/15 text-gray-400',
    stalled:     'bg-amber-500/15 text-amber-400',
    error:       'bg-red-500/15 text-red-400',
  };
</script>

<div class="group grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 rounded-lg border border-gray-800
            px-3 py-2.5 transition-colors hover:border-gray-700 hover:bg-gray-900/50">

  <!-- Row: name + badge + stats -->
  <div class="min-w-0">
    <!-- Name + status badge -->
    <div class="flex items-center gap-2">
      <span
        class="truncate text-sm text-gray-200"
        title={torrent.name}
      >{torrent.name}</span>
      <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium {badgeColor[torrent.category]}">
        {torrent.statusLabel}
      </span>
    </div>

    <!-- Progress bar -->
    <div class="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-800">
      <div
        class="h-full rounded-full transition-all duration-500 {barColor[torrent.category]}"
        style="width: {torrent.progress * 100}%"
      ></div>
    </div>

    <!-- Stats row -->
    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
      <!-- Always shown -->
      <span class="font-mono text-[11px] text-gray-400">{torrent.progressPct}</span>
      <span class="font-mono text-[11px] text-gray-500">{torrent.size}</span>

      <!-- Download speed + ETA — only when downloading -->
      {#if torrent.dlSpeed}
        <span class="font-mono text-[11px] text-green-400">↓ {torrent.dlSpeed}</span>
      {/if}
      {#if torrent.eta}
        <span class="font-mono text-[11px] text-gray-500">{torrent.eta}</span>
      {/if}

      <!-- Upload speed — when active -->
      {#if torrent.upSpeed}
        <span class="font-mono text-[11px] text-blue-400">↑ {torrent.upSpeed}</span>
      {/if}

      <!-- Ratio -->
      <span class="font-mono text-[11px] text-gray-600">R {torrent.ratio}</span>
    </div>
  </div>

  <!-- Controls — always visible on mobile, shown on hover on desktop -->
  <div class="flex shrink-0 flex-col items-end justify-center gap-1
              opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">

    <!-- Pause / Resume toggle -->
    <button
      on:click={() => send(torrent.isPaused ? 'resume' : 'pause')}
      title={torrent.isPaused ? 'Resume' : 'Pause'}
      class="flex h-6 w-6 items-center justify-center rounded text-gray-400
             hover:bg-gray-700 hover:text-gray-100 transition-colors text-xs"
    >
      {torrent.isPaused ? '▶' : '⏸'}
    </button>

    <!-- Priority up -->
    <button
      on:click={() => send('increasePrio')}
      title="Increase priority"
      class="flex h-6 w-6 items-center justify-center rounded text-gray-500
             hover:bg-gray-700 hover:text-gray-100 transition-colors text-xs"
    >↑</button>

    <!-- Priority down -->
    <button
      on:click={() => send('decreasePrio')}
      title="Decrease priority"
      class="flex h-6 w-6 items-center justify-center rounded text-gray-500
             hover:bg-gray-700 hover:text-gray-100 transition-colors text-xs"
    >↓</button>
  </div>
</div>
