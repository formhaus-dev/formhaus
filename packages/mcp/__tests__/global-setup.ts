import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export default function setup(): void {
  execFileSync('pnpm', ['run', 'build'], { cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'ignore' });
}
