<script>
  import '../app.css';
  import AppGrid from '$lib/components/AppGrid.svelte';
  import TorrentList from '$lib/components/TorrentList.svelte';

  /** @type {import('./$types').PageData} */
  export let data;
</script>

<svelte:head>
  <title>Homelab</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <!-- Header -->
  <header class="mb-10">
    <h1 class="text-2xl font-bold tracking-tight text-gray-100">Homelab</h1>
    <p class="mt-1 text-sm text-gray-500">192.168.0.76</p>
  </header>

  <!-- App tiles -->
  <AppGrid apps={data.apps} />

  <!-- Storage panel will go here in Phase 1 Feature 2 -->

  <!-- qBittorrent torrent module — always rendered, shows error state if qBit is offline -->
  <div class="mt-10 border-t border-gray-800/60 pt-10">
    <TorrentList />
  </div>
</div>
