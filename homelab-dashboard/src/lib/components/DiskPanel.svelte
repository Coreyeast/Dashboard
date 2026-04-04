<script>
  import { onMount } from 'svelte';

  let data    = null;
  let loading = true;
  let error   = null;

  onMount(async () => {
    try {
      const res = await fetch('/api/disk');
      const body = await res.json();
      if (!res.ok || body.error) {
        error = body.error ?? `HTTP ${res.status}`;
      } else {
        data = body;
      }
    } catch (e) {
      error = `Network error — ${e.message}`;
    } finally {
      loading = false;
    }
  });

  // Compute directory bars as % of the /data partition total (fallback: % of sum)
  $: dataTotalBytes = data?.partitions?.find((p) => p.mount === '/data')?.total ?? 0;
  $: dirTotal = data?.directories?.reduce((s, d) => s + d.bytes, 0) ?? 0;
  $: barBase = dataTotalBytes || dirTotal || 1;

  function pct(bytes) {
    return Math.min(100, Math.round((bytes / barBase) * 100));
  }

  function shortPath(path) {
    // e.g. /data/downloads/qbittorrent/completed → downloads/…/completed
    const parts = path.replace(/^\/data\//, '').split('/');
    if (parts.length <= 2) return parts.join('/');
    return `${parts[0]}/…/${parts[parts.length - 1]}`;
  }
</script>

<div class="rounded-xl border border-slate-200 bg-white shadow-sm
            dark:border-gray-800 dark:bg-gray-900/50 dark:shadow-none">

  <div class="border-b border-slate-200 px-5 py-3.5 dark:border-gray-800">
    <h3 class="font-mono text-xs font-semibold uppercase tracking-[0.15em] text-slate-600 dark:text-gray-400">
      Storage Overview
    </h3>
  </div>

  <div class="p-5">

    {#if loading}
      <div class="flex flex-col gap-4">
        {#each [1, 2] as _}
          <div class="h-16 animate-pulse rounded-lg bg-slate-200 dark:bg-gray-800"></div>
        {/each}
      </div>

    {:else if error}
      <p class="font-mono text-sm text-red-500">Could not load disk data: {error}</p>

    {:else}

      <!-- ── Partitions ─────────────────────────────────────────────────── -->
      <div class="flex flex-col gap-5">
        {#each data.partitions as p (p.mount)}
          <div>
            <div class="mb-1.5 flex items-baseline justify-between">
              <span class="font-mono text-xs font-semibold text-slate-700 dark:text-gray-300">
                {p.mount === '/' ? 'Root (/)' : `Data (${p.mount})`}
              </span>
              <span class="font-mono text-[10px] text-slate-500 dark:text-gray-500">
                {p.usedFmt} of {p.totalFmt} used
              </span>
            </div>
            <!-- Progress bar -->
            <div class="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-800">
              <div
                class="h-full rounded-full transition-[width] duration-700 ease-out
                       {p.pct > 85 ? 'bg-red-500' : p.pct > 70 ? 'bg-amber-500' : 'bg-blue-500'}"
                style="width: {p.pct}%"
              ></div>
            </div>
            <div class="mt-1 flex justify-between font-mono text-[10px] text-slate-400 dark:text-gray-600">
              <span>{p.pct}% used</span>
              <span>{p.availFmt} free</span>
            </div>
          </div>
        {/each}
      </div>

      <!-- ── Directory breakdown ───────────────────────────────────────── -->
      {#if data.directories?.length > 0}
        <div class="mt-5 border-t border-slate-200 pt-5 dark:border-gray-800">
          <p class="mb-3 font-mono text-[10px] uppercase tracking-widest text-slate-400 dark:text-gray-600">
            Directory Usage
          </p>
          <div class="flex flex-col gap-3">
            {#each data.directories as dir (dir.path)}
              <div>
                <div class="mb-1 flex items-baseline justify-between">
                  <span class="font-mono text-xs text-slate-700 dark:text-gray-300" title={dir.path}>
                    {dir.label}
                    <span class="ml-1 text-slate-400 dark:text-gray-600">{shortPath(dir.path)}</span>
                  </span>
                  <span class="font-mono text-[11px] font-semibold text-slate-600 dark:text-gray-400">
                    {dir.size}
                  </span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-gray-800">
                  <div
                    class="h-full rounded-full bg-violet-500 transition-[width] duration-700 ease-out"
                    style="width: {pct(dir.bytes)}%"
                  ></div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}

    {/if}
  </div>
</div>
