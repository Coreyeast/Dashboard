import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    // adapter-node produces a standalone Node.js server in the `build/` directory.
    // Run it with: node build
    adapter: adapter()
  }
};

export default config;
