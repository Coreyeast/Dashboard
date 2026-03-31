import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/** @type {import('./$types').PageServerLoad} */
export function load() {
  // Prefer the volume-mounted config so the user can edit without rebuilding.
  // Falls back to the copy bundled inside the image, then to the local dev path.
  const candidates = [
    '/app/config/apps.json',                    // Docker volume mount
    join(process.cwd(), 'config', 'apps.json'), // bundled in image / local dev
  ];

  const configPath = candidates.find(existsSync);

  if (!configPath) {
    throw new Error(
      `apps.json not found. Looked in: ${candidates.join(', ')}`
    );
  }

  const apps = JSON.parse(readFileSync(configPath, 'utf-8'));
  return { apps };
}
