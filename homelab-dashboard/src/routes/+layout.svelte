<script>
  import '../app.css';
  import NavBar from '$lib/components/NavBar.svelte';

  /** @type {import('./$types').LayoutData} */
  export let data;
</script>

<svelte:head>
  <title>andChill</title>
</svelte:head>

<!-- Sticky navigation bar — persists across all pages -->
<NavBar apps={data.apps} />

<!-- Page content -->
<slot />
