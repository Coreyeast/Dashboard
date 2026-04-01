<script>
  import { createEventDispatcher } from 'svelte';

  export let torrent;

  const dispatch = createEventDispatcher();

  let pending = null; // which action is in-flight

  function send(action) {
    pending = action;
    dispatch('action', { action, hashes: torrent.hash });
    // Clear the pending state after a short delay (parent will re-render on fetch)
    setTimeout(() => (pending = null), 1500);
  }

  // Tailwind classes by status category
  const bar = {
    downloading: 'bg-green-500',
    seeding:     'bg-blue-500',
    paused:      'bg-gray-600',
    stalled:     'bg-amber-500',
    error:       'bg-red-500',
  };

  const badge = {
    downloading: 'bg-green-500/20 text-green-400 border-green-500/30',
    seeding:     'bg-blue-500/20  text-blue-400  border-blue-500/30',
    paused:      'bg-gray-700/50  text-gray-400  border-gray-600/30',
    stalled:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
    error:       'bg-red-500/20   text-red-400   border-red-500/30',
  };
</script>

<div
  class="group grid grid-cols-[1fr_auto] gap-x-2 rounded-lg border border-transparent
         px-3 py-2.5 transition-colors hover:border-gray-700/60 hover:bg-gray-800/50"
>
  <!-- Left: name + bar + stats -->
  <div class="min-w-0">

    <!-- Name row -->
    <div class="flex items-center gap-2">
      <span class="truncate text-sm text-gray-200" title={torrent.name}>
        {torrent.name}
      </span>
      <span class="shrink-0 rounded border px-1.5 py-px font-mono text-[9px] font-medium {badge[torrent.category]}">
        {torrent.statusLabel}
      </span>
    </div>

    <!-- Progress bar -->
    <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-800">
      <div
        class="h-full rounded-full transition-[width] duration-700 ease-out {bar[torrent.category]}"
        style="width: {torrent.progress * 100}%"
      ></div>
    </div>

    <!-- Stats row -->
    <div class="mt-1 flex flex-wrap items-center gap-x-3">
      <span class="font-mono text-[11px] text-gray-400">{torrent.progressPct}</span>
      <span class="font-mono text-[11px] text-gray-600">{torrent.size}</span>

      {#if torrent.dlSpeed}
        <span class="font-mono text-[11px] text-green-400">↓ {torrent.dlSpeed}</span>
      {/if}
      {#if torrent.upSpeed}
        <span class="font-mono text-[11px] text-blue-400">↑ {torrent.upSpeed}</span>
      {/if}
      {#if torrent.eta}
        <span class="font-mono text-[11px] text-gray-500">{torrent.eta}</span>
      {/if}
      <span class="font-mono text-[11px] text-gray-700">R {torrent.ratio}</span>
    </div>
  </div>

  <!-- Right: controls — always visible on mobile, hover on desktop -->
  <div class="flex shrink-0 flex-col items-center justify-center gap-0.5
              opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">

    <button
      on:click={() => send(torrent.isPaused ? 'resume' : 'pause')}
      title={torrent.isPaused ? 'Resume' : 'Pause'}
      disabled={pending !== null}
      class="flex h-6 w-6 items-center justify-center rounded text-xs transition-colors
             {pending === 'pause' || pending === 'resume'
               ? 'animate-pulse bg-gray-700 text-gray-400'
               : 'text-gray-500 hover:bg-gray-700 hover:text-gray-200'}"
    >{torrent.isPaused ? '▶' : '⏸'}</button>

    <button
      on:click={() => send('increasePrio')}
      title="Increase priority"
      disabled={pending !== null}
      class="flex h-5 w-6 items-center justify-center rounded text-[10px] transition-colors
             {pending === 'increasePrio'
               ? 'animate-pulse bg-gray-700 text-gray-400'
               : 'text-gray-700 hover:bg-gray-700 hover:text-gray-300'}"
    >↑</button>

    <button
      on:click={() => send('decreasePrio')}
      title="Decrease priority"
      disabled={pending !== null}
      class="flex h-5 w-6 items-center justify-center rounded text-[10px] transition-colors
             {pending === 'decreasePrio'
               ? 'animate-pulse bg-gray-700 text-gray-400'
               : 'text-gray-700 hover:bg-gray-700 hover:text-gray-300'}"
    >↓</button>
  </div>
</div>
