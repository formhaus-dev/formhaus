import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { fromDefinition, toDefinition } from '../src';
import { normalize } from './fixtures';

const dir = join(__dirname, '../../core/fixtures/conformance');
const corpus: { name: string; issues: unknown[]; definition: FormDefinition }[] = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(dir, file), 'utf8')));

describe('conformance corpus round trip', () => {
  it.each(corpus.filter(({ issues }) => !issues.length).map(({ name, definition }) => [name, definition] as const))(
    '%s',
    (_, definition) => {
      expect(normalize(toDefinition(fromDefinition(definition)))).toEqual(normalize(definition));
    },
  );
});
