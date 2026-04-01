<script>
  import '../app.css';
  import AppGrid from '$lib/components/AppGrid.svelte';
  import TorrentList from '$lib/components/TorrentList.svelte';

  /** @type {import('./$types').PageData} */
  export let data;
</script>

<svelte:head>
  <title>andChill</title>
</svelte:head>

<div class="mx-auto max-w-5xl px-4 py-10 sm:px-6">

  <!-- Header -->
  <header class="mb-10 flex items-center gap-3">
    <img src="/logo.svg" alt="andChill logo" class="h-9 w-9 rounded-lg" />
    <h1 class="text-2xl font-bold tracking-tight text-gray-100">andChill</h1>
  </header>

  <!-- Downloads — shown first so it's immediately visible -->
  <TorrentList />

  <!-- App tiles -->
  <div class="mt-10 border-t border-gray-800/60 pt-10">
    <AppGrid apps={data.apps} />
  </div>

</div>
