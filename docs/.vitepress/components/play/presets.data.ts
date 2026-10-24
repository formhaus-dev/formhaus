import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { countsOf } from '../../../../scripts/templates-index.mjs';

export default {
  watch: ['../../../../examples/definitions/*.json'],
  load: (files: string[]) =>
    Object.fromEntries(files.map((file) => [basename(file, '.json'), countsOf(JSON.parse(readFileSync(file, 'utf8')))])) as Record<
      string,
      { steps: number; fields: number }
    >,
};
