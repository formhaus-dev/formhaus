import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const path = (file: string) => fileURLToPath(new URL(file, import.meta.url));

export const coreDefine = {
  __FORMHAUS_CORE_VERSION__: JSON.stringify(JSON.parse(readFileSync(path('./package.json'), 'utf8')).version),
};

export const coreSource = [
  { find: /^@formhaus\/core\/locales\/(.+)$/, replacement: path('./locales/$1.json') },
  { find: /^@formhaus\/core\/internal\/cloud$/, replacement: path('./src/internal/cloud.ts') },
  { find: /^@formhaus\/core\/(\w+)$/, replacement: path('./src/$1/index.ts') },
  { find: /^@formhaus\/core$/, replacement: path('./src/index.ts') },
];
