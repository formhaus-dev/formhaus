import type { EditorHost, SavedDraft } from '../host';
import { baseHost, savedDraft, type HostOptions } from './base';

export type MemoryHostOptions = HostOptions;

export function createMemoryHost({ definition, onChange, ...options }: MemoryHostOptions): EditorHost {
  let draft: SavedDraft | null = definition ? savedDraft(definition, 1) : null;
  return {
    ...baseHost(options),
    ephemeral: true,
    load: () => Promise.resolve({ draft, published: null }),
    save: (next, revision) => {
      draft = savedDraft(next, revision + 1);
      onChange?.(next);
      return Promise.resolve(draft);
    },
    discard: () => {
      draft = null;
      return Promise.resolve();
    },
    stored: () => draft !== null,
  };
}
