<script>
  import Logo from './Logo.svelte';
  import NavLink from './NavLink.svelte';

  /** @type {Array<{ name: string, label?: string, group?: string, url: string, color: string, description: string }>} */
  export let apps = [];

  let menuOpen      = false;
  let manageOpen    = false;

  $: primaryApps    = apps.filter((a) => a.group === 'primary');
  $: managementApps = apps.filter((a) => a.group !== 'primary');

  function handleKeydown(e) {
    if (e.key === 'Escape') { menuOpen = false; manageOpen = false; }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Backdrop — closes management dropdown on outside click -->
{#if manageOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-40" on:click={() => (manageOpen = false)} aria-hidden="true"></div>
{/if}

<nav class="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 backdrop-blur-sm">
  <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6">

    <!-- ── Brand ─────────────────────────────────────────────────────── -->
    <a href="/" class="flex shrink-0 items-center gap-2.5">
      <Logo class="h-8 w-8" />
      <span class="text-lg font-bold leading-none">
        <span class="text-gray-100">and</span><span style="color: #B5233E">Chill</span>
      </span>
    </a>

    <!-- ── Desktop nav (lg+) ─────────────────────────────────────────── -->
    <div class="hidden items-center gap-0.5 lg:flex">

      <!-- Primary links: Watch · Request · Downloads -->
      {#each primaryApps as app (app.name)}
        <NavLink {app} />
      {/each}

      <!-- Divider -->
      {#if managementApps.length > 0}
        <div class="mx-2 h-5 w-px bg-gray-700/60"></div>

        <!-- Management dropdown -->
        <div class="relative z-50">
          <button
            on:click={() => (manageOpen = !manageOpen)}
            class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors
                   {manageOpen
                     ? 'bg-gray-800 text-gray-200'
                     : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'}"
          >
            <!-- Cog icon -->
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
            <span>Manage</span>
            <!-- Chevron -->
            <svg xmlns="http://www.w3.org/2000/svg"
                 class="h-3.5 w-3.5 shrink-0 transition-transform duration-150 {manageOpen ? 'rotate-180' : ''}"
                 viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>

          {#if manageOpen}
            <div
              class="absolute right-0 top-full mt-1.5 w-52 rounded-xl border border-gray-700/60
                     bg-gray-900 p-1.5 shadow-2xl shadow-black/50"
            >
              {#each managementApps as app (app.name)}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div on:click={() => (manageOpen = false)}>
                  <NavLink {app} />
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- ── Hamburger (< lg) ──────────────────────────────────────────── -->
    <button
      class="flex h-9 w-9 items-center justify-center rounded-md text-gray-400
             transition-colors hover:bg-gray-800 hover:text-gray-200 lg:hidden"
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      aria-expanded={menuOpen}
      on:click={() => (menuOpen = !menuOpen)}
    >
      {#if menuOpen}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
        </svg>
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clip-rule="evenodd"/>
        </svg>
      {/if}
    </button>
  </div>

  <!-- ── Mobile dropdown ───────────────────────────────────────────────── -->
  {#if menuOpen}
    <div class="border-t border-gray-800 bg-gray-900 px-4 py-3 lg:hidden" role="menu">

      <!-- Primary apps -->
      {#if primaryApps.length > 0}
        <div class="grid grid-cols-2 gap-1 sm:grid-cols-3">
          {#each primaryApps as app (app.name)}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div on:click={() => (menuOpen = false)}>
              <NavLink {app} showPort={true} />
            </div>
          {/each}
        </div>
      {/if}

      <!-- Management apps -->
      {#if managementApps.length > 0}
        <div class="mt-3 border-t border-gray-800 pt-3">
          <p class="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-widest text-gray-600">
            Management
          </p>
          <div class="grid grid-cols-2 gap-1 sm:grid-cols-3">
            {#each managementApps as app (app.name)}
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <!-- svelte-ignore a11y-no-static-element-interactions -->
              <div on:click={() => (menuOpen = false)}>
                <NavLink {app} showPort={true} />
              </div>
            {/each}
          </div>
        </div>
      {/if}

    </div>
  {/if}
</nav>
