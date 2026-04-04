<script>
  import Logo    from './Logo.svelte';
  import NavLink from './NavLink.svelte';
  import { theme } from '$lib/stores/theme.js';

  /** @type {Array<{ name: string, label?: string, group?: string, url: string, color: string, description: string }>} */
  export let apps = [];

  let menuOpen   = false;
  let manageOpen = false;

  $: primaryApps    = apps.filter((a) => a.group === 'primary');
  $: managementApps = apps.filter((a) => a.group !== 'primary');
  $: isDark = $theme !== 'light';

  function toggleTheme() {
    theme.set(isDark ? 'light' : 'dark');
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') { menuOpen = false; manageOpen = false; }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- Backdrop for management dropdown -->
{#if manageOpen}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="fixed inset-0 z-40" on:click={() => (manageOpen = false)} aria-hidden="true"></div>
{/if}

<nav class="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm
            dark:border-gray-800 dark:bg-gray-900/95">
  <!--
    3-column grid: [logo | center links | theme toggle]
    On mobile collapse to: [logo | hamburger]
  -->
  <div class="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center
              gap-4 px-5 py-3.5 sm:px-6">

    <!-- ── Col 1: Brand ────────────────────────────────────────────── -->
    <a href="/" class="flex shrink-0 items-center gap-3">
      <Logo class="h-9 w-9" />
      <span class="text-xl font-bold leading-none">
        <span class="text-slate-900 dark:text-gray-100">and</span><span style="color: #B5233E">Chill</span>
      </span>
    </a>

    <!-- ── Col 2: Primary nav + manage dropdown (desktop) ──────────── -->
    <div class="hidden items-center justify-center gap-1 lg:flex">

      {#each primaryApps as app (app.name)}
        <NavLink {app} />
      {/each}

      {#if managementApps.length > 0}
        <div class="mx-2 h-5 w-px bg-slate-300 dark:bg-gray-700/60"></div>

        <!-- Management dropdown -->
        <div class="relative z-50">
          <button
            on:click={() => (manageOpen = !manageOpen)}
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium
                   transition-colors
                   {manageOpen
                     ? 'bg-slate-100 text-slate-900 dark:bg-gray-800 dark:text-gray-200'
                     : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'}"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
            <span>Manage</span>
            <svg xmlns="http://www.w3.org/2000/svg"
                 class="h-3.5 w-3.5 shrink-0 transition-transform duration-150 {manageOpen ? 'rotate-180' : ''}"
                 viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>

          {#if manageOpen}
            <div class="absolute left-1/2 top-full mt-2 w-56 -translate-x-1/2 rounded-xl
                        border border-slate-200 bg-white p-1.5 shadow-xl shadow-black/10
                        dark:border-gray-700/60 dark:bg-gray-900 dark:shadow-black/50">
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

    <!-- ── Col 3: Theme toggle + hamburger ─────────────────────────── -->
    <div class="flex items-center gap-2">

      <!-- Theme toggle (always visible) -->
      <button
        on:click={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500
               transition-colors hover:bg-slate-100 hover:text-slate-900
               dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {#if isDark}
          <!-- Sun icon — click to go light -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
          </svg>
        {:else}
          <!-- Moon icon — click to go dark -->
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
          </svg>
        {/if}
      </button>

      <!-- Hamburger (mobile only) -->
      <button
        class="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500
               transition-colors hover:bg-slate-100 hover:text-slate-900
               dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 lg:hidden"
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
  </div>

  <!-- ── Mobile menu ───────────────────────────────────────────────── -->
  {#if menuOpen}
    <div class="border-t border-slate-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 lg:hidden"
         role="menu">

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
        <div class="mt-3 border-t border-slate-200 pt-3 dark:border-gray-800">
          <p class="mb-1.5 px-2 font-mono text-[10px] uppercase tracking-widest
                    text-slate-400 dark:text-gray-600">
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
