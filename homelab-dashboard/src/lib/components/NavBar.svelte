<script>
  import Logo from './Logo.svelte';
  import NavLink from './NavLink.svelte';

  /** @type {Array<{ name: string, url: string, color: string, description: string }>} */
  export let apps = [];

  let menuOpen = false;

  function toggleMenu() {
    menuOpen = !menuOpen;
  }

  // Close the dropdown if the user clicks outside of it
  function handleKeydown(e) {
    if (e.key === 'Escape') menuOpen = false;
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<nav class="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
  <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">

    <!-- ── Brand ─────────────────────────────────────────────────────── -->
    <a href="/" class="flex shrink-0 items-center gap-2.5">
      <Logo class="h-8 w-8" />
      <span class="text-lg font-bold leading-none">
        <span class="text-gray-100">and</span><span class="text-purple-400">Chill</span>
      </span>
    </a>

    <!-- ── Desktop app links (lg+) ───────────────────────────────────── -->
    <div class="hidden items-center gap-0.5 lg:flex">
      {#each apps as app (app.name)}
        <NavLink {app} />
      {/each}
    </div>

    <!-- ── Hamburger (< lg) ──────────────────────────────────────────── -->
    <button
      class="flex h-9 w-9 items-center justify-center rounded-md text-gray-400
             transition-colors hover:bg-gray-800 hover:text-gray-200 lg:hidden"
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={menuOpen}
      on:click={toggleMenu}
    >
      {#if menuOpen}
        <!-- × close icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      {:else}
        <!-- ☰ hamburger icon -->
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
        </svg>
      {/if}
    </button>
  </div>

  <!-- ── Mobile dropdown ───────────────────────────────────────────────── -->
  {#if menuOpen}
    <div
      class="border-t border-gray-800 bg-gray-900 px-4 py-3 lg:hidden"
      role="menu"
    >
      <div class="grid grid-cols-2 gap-1 sm:grid-cols-3">
        {#each apps as app (app.name)}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div on:click={() => (menuOpen = false)}>
            <NavLink {app} showPort={true} />
          </div>
        {/each}
      </div>
    </div>
  {/if}
</nav>
