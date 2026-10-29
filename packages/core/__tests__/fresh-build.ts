import { existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const core = join(__dirname, '..');
const inputs = ['src', 'fixtures'].map((dir) => join(core, dir));

function newest(dir: string): number {
  return readdirSync(dir, { withFileTypes: true }).reduce((latest, entry) => {
    const path = join(dir, entry.name);
    return Math.max(latest, entry.isDirectory() ? newest(path) : statSync(path).mtimeMs);
  }, 0);
}

export const freshBuild = (file: string): boolean =>
  !!process.env.CI || (existsSync(file) && statSync(file).mtimeMs >= Math.max(...inputs.map(newest)));
