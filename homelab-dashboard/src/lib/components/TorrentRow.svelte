<script>
  import { createEventDispatcher } from 'svelte';

  export let torrent;
  export let isSeeding = false;
  export let isFirst = false;
  export let isLast = false;

  const dispatch = createEventDispatcher();
  let pending = null;

  function send(action) {
    pending = action;
    dispatch('action', { action, hashes: torrent.hash });
    setTimeout(() => (pending = null), 1500);
  }

  $: isStopped = torrent.category === 'stopped';

  const bar = {
    downloading: 'bg-green-500',
    stalled:     'bg-amber-500',
    stopped:     'bg-gray-600',
    queued:      'bg-blue-500',
    seeding:     'bg-teal-500',
    error:       'bg-red-500',
  };

  const badge = {
    downloading: 'bg-green-500/20 text-green-400 border-green-500/30',
    stalled:     'bg-amber-500/20 text-amber-400 border-amber-500/30',
    stopped:     'bg-gray-700/50  text-gray-400  border-gray-600/30',
    queued:      'bg-blue-500/20  text-blue-400  border-blue-500/30',
    seeding:     'bg-teal-500/20  text-teal-400  border-teal-500/30',
    error:       'bg-red-500/20   text-red-400   border-red-500/30',
  };

  $: barClass   = bar[torrent.category]   ?? bar.error;
  $: badgeClass = badge[torrent.category] ?? badge.error;
</script>

<!--
  Fixed 4-column grid: [14px drag handle] [28px priority#] [1fr content] [auto controls]
  All 4 slots are always rendered so columns stay correctly mapped for both active and seeding rows.
  Seeding rows hide the first two slots with `invisible` (preserves layout space).
-->
<div
  class="grid items-center gap-x-2 rounded-lg border border-transparent px-2 py-2
         transition-colors hover:border-gray-700/60 hover:bg-gray-800/50"
  style="grid-template-columns: 14px 28px 1fr auto"
>

  <!-- ── Drag handle (invisible for seeding rows, keeps grid layout intact) ── -->
  <div
    class="flex items-center {isSeeding
      ? 'invisible'
      : 'cursor-grab text-gray-700 hover:text-gray-500 active:cursor-grabbing'}"
    title={isSeeding ? '' : 'Drag to reorder'}
  >
    <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor" aria-hidden="true">
      <circle cx="2.5" cy="2"  r="1.3"/>
      <circle cx="7.5" cy="2"  r="1.3"/>
      <circle cx="2.5" cy="7"  r="1.3"/>
      <circle cx="7.5" cy="7"  r="1.3"/>
      <circle cx="2.5" cy="12" r="1.3"/>
      <circle cx="7.5" cy="12" r="1.3"/>
    </svg>
  </div>

  <!-- ── Priority number (invisible for seeding rows) ─────────────────────── -->
  <span
    class="text-right font-mono text-[10px] {isSeeding ? 'invisible' : 'text-gray-600'}"
    aria-label={isSeeding ? '' : 'Priority'}
  >
    {#if !isSeeding}
      {torrent.priority > 0 ? `#${torrent.priority}` : '—'}
    {/if}
  </span>

  <!-- ── Main content: name + progress bar + stats ─────────────────────────── -->
  <div class="min-w-0">

    <!-- Name + badge -->
    <div class="flex items-center gap-2">
      <span class="truncate text-sm text-gray-200" title={torrent.name}>
        {torrent.name}
      </span>
      <span class="shrink-0 rounded border px-1.5 py-px font-mono text-[9px] font-medium {badgeClass}">
        {torrent.statusLabel}
      </span>
    </div>

    <!-- Progress bar -->
    <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-800">
      <div
        class="h-full rounded-full transition-[width] duration-700 ease-out {barClass}"
        style="width: {torrent.progress * 100}%"
      ></div>
    </div>

    <!-- Stats -->
    <div class="mt-1 flex flex-wrap items-center gap-x-3">
      <span class="font-mono text-[11px] text-gray-400">{torrent.progressPct}</span>
      <span class="font-mono text-[11px] text-gray-600">{torrent.size}</span>
      {#if torrent.dlSpeed}
        <span class="font-mono text-[11px] text-green-400">↓ {torrent.dlSpeed}</span>
      {/if}
      {#if torrent.upSpeed}
        <span class="font-mono text-[11px] text-teal-400">↑ {torrent.upSpeed}</span>
      {/if}
      {#if torrent.eta}
        <span class="font-mono text-[11px] text-gray-500">{torrent.eta}</span>
      {/if}
      <span class="font-mono text-[11px] text-gray-700">R {torrent.ratio}</span>
    </div>
  </div>

  <!-- ── Controls ──────────────────────────────────────────────────────────── -->
  <div class="ml-1 flex shrink-0 items-center gap-0.5">

    <!-- Pause / Resume toggle -->
    <button
      on:click={() => send(isStopped ? 'resume' : 'pause')}
      title={isStopped ? 'Resume' : 'Pause'}
      disabled={pending !== null}
      class="flex h-6 w-6 items-center justify-center rounded text-xs transition-colors
             {pending === 'pause' || pending === 'resume'
               ? 'animate-pulse bg-gray-700 text-gray-400'
               : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'}"
    >{isStopped ? '▶' : '⏸'}</button>

    <!-- Priority buttons — active queue only -->
    {#if !isSeeding}

      <button
        on:click={() => send('topPrio')}
        title="Top priority"
        disabled={pending !== null || isFirst}
        class="flex h-6 w-6 items-center justify-center rounded font-mono text-[11px]
               transition-colors
               {isFirst
                 ? 'cursor-not-allowed text-gray-700'
                 : pending === 'topPrio'
                   ? 'animate-pulse bg-gray-700 text-gray-400'
                   : 'text-gray-500 hover:bg-gray-700 hover:text-gray-200'}"
        aria-label="Move to top"
      >↟</button>

      <button
        on:click={() => send('increasePrio')}
        title="Move up one"
        disabled={pending !== null || isFirst}
        class="flex h-6 w-6 items-center justify-center rounded font-mono text-[11px]
               transition-colors
               {isFirst
                 ? 'cursor-not-allowed text-gray-700'
                 : pending === 'increasePrio'
                   ? 'animate-pulse bg-gray-700 text-gray-400'
                   : 'text-gray-500 hover:bg-gray-700 hover:text-gray-200'}"
        aria-label="Move up"
      >↑</button>

      <button
        on:click={() => send('decreasePrio')}
        title="Move down one"
        disabled={pending !== null || isLast}
        class="flex h-6 w-6 items-center justify-center rounded font-mono text-[11px]
               transition-colors
               {isLast
                 ? 'cursor-not-allowed text-gray-700'
                 : pending === 'decreasePrio'
                   ? 'animate-pulse bg-gray-700 text-gray-400'
                   : 'text-gray-500 hover:bg-gray-700 hover:text-gray-200'}"
        aria-label="Move down"
      >↓</button>

    {/if}
  </div>
</div>
