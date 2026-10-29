import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { compileScript, parse, registerTS, version } from 'vue/compiler-sfc';

registerTS((version.startsWith('3.3.') ? ts : () => ts) as never);

const file = join(__dirname, 'fixtures/CoreTypes.vue');
const { descriptor } = parse(readFileSync(file, 'utf8'), { filename: file });
const { content } = compileScript(descriptor, { id: 'core-types' });

describe('core types in a consumer defineProps', () => {
  it.each([
    ['code', 'String'],
    ['summary', 'Object'],
    ['group', 'Object'],
    ['section', 'Object'],
    ['field', 'Object'],
  ])('compiles %s to %s', (key, type) => {
    expect(content).toContain(`${key}: { type: ${type}, required: true }`);
  });
});
