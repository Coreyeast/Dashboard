<!--
  NavLink — a compact app shortcut used inside the top nav bar.
  On desktop: badge + name inline.
  When showPort is true (mobile dropdown): also shows the port underneath.
-->
<script>
  /** @type {{ name: string, url: string, color: string, description: string }} */
  export let app;
  export let showPort = false;

  $: displayName = app.label ?? app.name;
  $: initials = displayName.slice(0, 2).toUpperCase();

  $: port = (() => {
    try {
      const { port: p } = new URL(app.url);
      return p ? `:${p}` : '';
    } catch {
      return '';
    }
  })();
</script>

<a
  href={app.url}
  target="_blank"
  rel="noopener noreferrer"
  class="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors
         hover:bg-gray-800 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/30"
>
  <!-- Coloured badge -->
  <span
    class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-[9px] font-bold text-white"
    style="background-color: {app.color};"
  >{initials}</span>

  <!-- Name (+ optional port on mobile) -->
  <span class="min-w-0">
    <span class="block text-sm text-gray-300 group-hover:text-white">{displayName}</span>
    {#if showPort && port}
      <span class="block font-mono text-[10px] text-gray-600">{port}</span>
    {/if}
  </span>
</a>
