import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { combinations, readResolver, validateTokens } from '../../scripts/tokens-resolver.mjs';

const source = resolve(__dirname, '../../tokens');
const copies: string[] = [];

function copyTokens() {
  const dir = mkdtempSync(join(tmpdir(), 'fh-tokens-'));
  cpSync(source, dir, { recursive: true });
  copies.push(dir);
  return dir;
}

function editJson<T>(dir: string, file: string, edit: (json: T) => void) {
  const path = join(dir, file);
  const json = JSON.parse(readFileSync(path, 'utf8'));
  edit(json);
  writeFileSync(path, JSON.stringify(json));
}

afterEach(() => {
  for (const dir of copies.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe('design tokens', () => {
  it('checks all 16 mode combinations without problems', async () => {
    const { resolver, problems } = await validateTokens(source);
    expect(combinations(resolver.modifiers)).toHaveLength(16);
    expect(problems).toEqual([]);
  });

  it('catches derived values that drift only in a combined mode', async () => {
    const dir = copyTokens();
    editJson<{ color: Record<string, unknown> }>(dir, 'modes/contrast-more.tokens.json', (json) => {
      json.color.bg = { default: { $value: '{palette.white}' } };
    });
    const { problems } = await validateTokens(dir);
    expect(problems.some((problem) => problem.startsWith('color.primary.soft in theme dark') && problem.includes('contrast more'))).toBe(
      true,
    );
    expect(problems.some((problem) => problem.includes('theme light'))).toBe(false);
  });

  it('catches a hex that does not match its components', async () => {
    const dir = copyTokens();
    editJson<{ palette: { zinc: Record<string, { $value: { hex: string } }> } }>(dir, 'primitive.tokens.json', (json) => {
      json.palette.zinc['450'].$value.hex = '#84848e';
    });
    const { problems } = await validateTokens(dir);
    expect(problems).toContain('palette.zinc.450: hex #84848e does not match components');
  });

  it('loads sets only through resolutionOrder', () => {
    const dir = copyTokens();
    editJson<{ resolutionOrder: { $ref: string }[] }>(dir, 'formhaus.resolver.json', (json) => {
      json.resolutionOrder.shift();
    });
    expect(() => readResolver(dir)).toThrow('sets.foundation is not in resolutionOrder');
  });

  it('rejects missing and unreferenced token files', () => {
    const missing = copyTokens();
    rmSync(join(missing, 'modes/width-compact.tokens.json'));
    expect(() => readResolver(missing)).toThrow('modes/width-compact.tokens.json does not exist');

    const extra = copyTokens();
    writeFileSync(join(extra, 'modes/extra.tokens.json'), '{}');
    expect(() => readResolver(extra)).toThrow('modes/extra.tokens.json is not referenced');
  });

  it('rejects references to undefined sets', () => {
    const dir = copyTokens();
    editJson<{ resolutionOrder: { $ref: string }[] }>(dir, 'formhaus.resolver.json', (json) => {
      json.resolutionOrder.push({ $ref: '#/sets/missing' });
    });
    expect(() => readResolver(dir)).toThrow('#/sets/missing is not defined');
  });
});
