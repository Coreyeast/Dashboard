import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const initial = browser ? (localStorage.getItem('theme') ?? 'dark') : 'dark';

export const theme = writable(initial);

if (browser) {
  theme.subscribe((value) => {
    localStorage.setItem('theme', value);
    document.documentElement.classList.toggle('dark', value !== 'light');
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', value === 'light' ? 'light' : 'dark');
  });
}
