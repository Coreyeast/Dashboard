<!--
  andChill logo — inline SVG so it inherits colour context and never makes
  a network request. Pass a `class` prop to control size.

  Usage:
    <Logo class="h-8 w-8" />
-->
<script>
  let cls = '';
  export { cls as class };
</script>

<svg
  class={cls}
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 32 32"
  fill="none"
  aria-label="andChill logo"
  role="img"
>
  <!-- Rounded square background -->
  <rect width="32" height="32" rx="8" fill="#B5233E" />
  <!-- Play triangle -->
  <path d="M12 9.5 L12 22.5 L24 16 Z" fill="white" opacity="0.95" />
  <!-- Small accent dot — hints at the "and" in andChill -->
  <circle cx="10" cy="24" r="2.5" fill="white" opacity="0.45" />
</svg>
