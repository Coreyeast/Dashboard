import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/** @type {import('./$types').LayoutServerLoad} */
export function load() {
  const candidates = [
    '/app/config/apps.json',
    join(process.cwd(), 'config', 'apps.json'),
  ];

  const configPath = candidates.find(existsSync);

  if (!configPath) {
    throw new Error(`apps.json not found. Looked in: ${candidates.join(', ')}`);
  }

  const apps = JSON.parse(readFileSync(configPath, 'utf-8'));
  return { apps };
}
