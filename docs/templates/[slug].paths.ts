import { readFileSync } from 'node:fs';
import type { TemplateEntry } from '../.vitepress/components/templates/catalog';

const directory = new URL('../../templates/', import.meta.url);
const read = (name: string) => JSON.parse(readFileSync(new URL(name, directory), 'utf8'));

export default {
  watch: ['../../templates/*.json'],
  paths() {
    return (read('index.json') as TemplateEntry[]).map((entry) => ({
      params: { ...entry, definition: read(`${entry.slug}.json`).definition },
    }));
  },
};
