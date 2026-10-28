import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const packages = join(__dirname, '../../..');
const coreDist = join(packages, 'core/dist');
const built = existsSync(join(coreDist, 'cloud.js'));
const relativeImport = /(?:from|import)\s*['"](\.[^'"]+)['"]/g;
const networkCode = /fetch\(|api\.formhaus/;

function reached(entry: string): string[] {
  const seen = new Set<string>();
  const pending = [entry];
  while (pending.length > 0) {
    const file = pending.pop() as string;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const [, specifier] of readFileSync(file, 'utf8').matchAll(relativeImport)) pending.push(join(dirname(file), specifier));
  }
  return [...seen];
}

function reachesNetworkCode(entry: string): boolean {
  return reached(join(coreDist, entry)).some((file) => networkCode.test(readFileSync(file, 'utf8')));
}

describe.skipIf(!built && !process.env.CI)('core dist import graph', () => {
  it.each(['index.js', 'internal.js', 'server.js'])('%s reaches no network code', (entry) => {
    expect(reachesNetworkCode(entry)).toBe(false);
  });

  it.each(['cloud.js', 'internal/cloud.js'])('%s reaches network code', (entry) => {
    expect(reachesNetworkCode(entry)).toBe(true);
  });

  it.each(['react', 'vue'])('@formhaus/%s main entry imports no Cloud entry', (name) => {
    const source = readFileSync(join(packages, name, 'dist/index.js'), 'utf8');
    expect(source).not.toMatch(/@formhaus\/core\/(cloud|internal\/cloud)/);
  });
});
