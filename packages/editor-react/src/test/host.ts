import type { EditorHost } from '../host';

export function testHost(overrides: Partial<EditorHost> = {}): EditorHost {
  return {
    isNew: true,
    readOnly: false,
    load: () => Promise.resolve({ draft: null, published: null }),
    save: (definition, revision) =>
      Promise.resolve({ definition, revision: revision + 1, baseVersion: null, savedAt: new Date().toISOString(), savedBy: '' }),
    discard: () => Promise.resolve(),
    stored: () => false,
    publish: () => Promise.resolve({ formId: 'f1', version: 1, warnings: [] }),
    notify: () => undefined,
    describeError: String,
    ago: () => 'just now',
    Preview: () => null,
    ...overrides,
  };
}
