<script>
  import AppTile from './AppTile.svelte';

  /** @type {Array<{ name: string, url: string, color: string, description: string }>} */
  export let apps = [];
</script>

<!--
  5 columns on large screens, 3 on medium, 2 on small.
  Brief calls for 5 on desktop and 2-3 on mobile.
-->
<section>
  <h2 class="mb-4 text-xs font-semibold uppercase tracking-widest text-gray-500">Services</h2>
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
    {#each apps as app (app.name)}
      <AppTile {app} />
    {/each}
  </div>
</section>
