<script>
  import { createEventDispatcher, onMount, onDestroy } from 'svelte';

  export let diskActive = false;

  const dispatch = createEventDispatcher();

  let stats  = null;
  let pollId;

  async function fetchStats() {
    try {
      const res  = await fetch('/api/stats');
      const data = await res.json();
      if (!res.ok || data.error) return;
      stats = data;
    } catch { /* network error — keep stale */ }
  }

  onMount(() => {
    fetchStats();
    pollId = setInterval(fetchStats, 5000);
  });

  onDestroy(() => clearInterval(pollId));

</script>

<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">

  <!-- ── Download Speed ────────────────────────────────────────────── -->
  <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4
              shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
    <div class="flex items-start justify-between">
      <!-- Icon: blue, download arrow -->
      <span class="flex h-10 w-10 items-center justify-center rounded-xl"
            style="background-color: #2563EB">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      </span>
    </div>
    <div>
      <p class="font-mono text-[11px] uppercase tracking-widest text-slate-500 dark:text-gray-500">
        Download Speed
      </p>
      <p class="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-gray-100">
        {stats ? stats.dlSpeed : '—'}
      </p>
    </div>
  </div>

  <!-- ── Upload Speed ──────────────────────────────────────────────── -->
  <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4
              shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
    <div class="flex items-start justify-between">
      <span class="flex h-10 w-10 items-center justify-center rounded-xl"
            style="background-color: #059669">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
        </svg>
      </span>
    </div>
    <div>
      <p class="font-mono text-[11px] uppercase tracking-widest text-slate-500 dark:text-gray-500">
        Upload Speed
      </p>
      <p class="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-gray-100">
        {stats ? stats.upSpeed : '—'}
      </p>
    </div>
  </div>

  <!-- ── Active Tasks ──────────────────────────────────────────────── -->
  <div class="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4
              shadow-sm dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">
    <div class="flex items-start justify-between">
      <span class="flex h-10 w-10 items-center justify-center rounded-xl"
            style="background-color: #7C3AED">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
        </svg>
      </span>
    </div>
    <div>
      <p class="font-mono text-[11px] uppercase tracking-widest text-slate-500 dark:text-gray-500">
        Active Tasks
      </p>
      <p class="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-gray-100">
        {stats ? stats.activeTasks : '—'}
      </p>
    </div>
  </div>

  <!-- ── Disk Space (clickable) ────────────────────────────────────── -->
  <button
    on:click={() => dispatch('diskclick')}
    class="flex flex-col gap-3 rounded-xl border p-4 text-left shadow-sm
           transition-colors dark:shadow-none
           {diskActive
             ? 'border-slate-400 bg-slate-200 dark:border-gray-600 dark:bg-gray-800/80'
             : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-gray-800 dark:bg-gray-900/50 dark:hover:border-gray-700 dark:hover:bg-gray-800/60'}"
  >
    <div class="flex items-start justify-between">
      <span class="flex h-10 w-10 items-center justify-center rounded-xl"
            style="background-color: #475569">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.5 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3zM2 12a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2zM14.5 15a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/>
        </svg>
      </span>
      <!-- Chevron indicator -->
      <svg xmlns="http://www.w3.org/2000/svg"
           class="h-4 w-4 text-slate-400 transition-transform dark:text-gray-600
                  {diskActive ? 'rotate-180' : ''}"
           viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div>
      <p class="font-mono text-[11px] uppercase tracking-widest text-slate-500 dark:text-gray-500">
        Disk Space
      </p>
      <p class="mt-0.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-gray-100">
        {stats ? stats.freeSpace : '—'}
      </p>
      <p class="mt-0.5 font-mono text-[10px] text-slate-400 dark:text-gray-600">free</p>
    </div>
  </button>

</div>
