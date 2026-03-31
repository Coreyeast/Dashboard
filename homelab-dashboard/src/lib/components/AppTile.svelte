<script>
  // An individual app tile. Opens the service URL in a new tab when clicked.
  /** @type {{ name: string, url: string, color: string, description: string }} */
  export let app;

  // Derive a short label for the fallback badge (first two letters, uppercase)
  $: initials = app.name.slice(0, 2).toUpperCase();

  // Extract just the port from the URL for the subtitle (e.g. ":8096")
  $: port = (() => {
    try {
      const { port: p, hostname } = new URL(app.url);
      return p ? `:${p}` : hostname;
    } catch {
      return app.url;
    }
  })();
</script>

<a
  href={app.url}
  target="_blank"
  rel="noopener noreferrer"
  class="group flex flex-col gap-3 rounded-xl border border-gray-800 bg-gray-900 p-4
         transition-all duration-150 hover:border-gray-600 hover:bg-gray-800 focus:outline-none
         focus-visible:ring-2 focus-visible:ring-white/30"
>
  <!-- Colour badge -->
  <div
    class="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
    style="background-color: {app.color};"
  >
    {initials}
  </div>

  <!-- App name + port -->
  <div class="min-w-0">
    <p class="truncate text-sm font-semibold text-gray-100 group-hover:text-white">
      {app.name}
    </p>
    <p class="truncate text-xs text-gray-500">{port}</p>
  </div>

  <!-- Description -->
  <p class="mt-auto truncate text-xs text-gray-600 group-hover:text-gray-500">
    {app.description}
  </p>
</a>
