<script>
  import StatBar    from '$lib/components/StatBar.svelte';
  import DiskPanel  from '$lib/components/DiskPanel.svelte';
  import TorrentList from '$lib/components/TorrentList.svelte';

  let diskOpen = false;
</script>

<div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">

  <!-- ── Page header ────────────────────────────────────────────────── -->
  <div class="mb-6">
    <h1 class="text-2xl font-bold tracking-tight text-slate-900 dark:text-gray-100">
      Dashboard
    </h1>
    <p class="mt-1 text-sm text-slate-500 dark:text-gray-500">
      Manage your active downloads and server status.
    </p>
  </div>

  <!-- ── Stat modules ───────────────────────────────────────────────── -->
  <div class="mb-4">
    <StatBar
      {diskOpen}
      on:diskclick={() => (diskOpen = !diskOpen)}
    />
  </div>

  <!-- ── Disk panel (expandable, between stats and downloads) ─────── -->
  {#if diskOpen}
    <div class="mb-4">
      <DiskPanel />
    </div>
  {/if}

  <!-- ── Download queue ────────────────────────────────────────────── -->
  <TorrentList />

</div>
