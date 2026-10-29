import { describe, expect, it } from 'vitest';
import { parse } from 'vue/compiler-sfc';

type PropOption = { type?: unknown } | unknown;

const sources = import.meta.glob<string>('../src/**/*.vue', { eager: true, query: '?raw', import: 'default' });
const components = import.meta.glob<{ default: { props?: Record<string, PropOption> } }>('../src/**/*.vue', { eager: true });

const object = ['Object'];
const objectOrFunction = ['Object', 'Function'];
const expected: Record<string, string[]> = {
  labels: objectOrFunction,
  messages: objectOrFunction,
  cloudLabels: objectOrFunction,
  errorSummary: ['Boolean', 'String'],
  locale: ['Object', 'Array'],
  draftStore: ['Object', 'Boolean'],
  ...Object.fromEntries(
    ['engine', 'group', 'field', 'definition', 'option', 'notice', 'reveal', 'initialForm', 'section', 'matrix'].map((key) => [
      key,
      object,
    ]),
  ),
};

const typeNames = (option: PropOption) => {
  const type = option !== null && typeof option === 'object' && 'type' in option ? option.type : option;
  return (Array.isArray(type) ? type : [type]).map((entry) => (entry as { name?: string } | null)?.name ?? null);
};

describe('SFC props', () => {
  it.each(Object.keys(sources))('%s declares props through a runtime object', (file) => {
    const { descriptor } = parse(sources[file], { filename: file });
    expect(descriptor.scriptSetup?.content ?? '', `${file} uses type-only defineProps`).not.toMatch(/defineProps\s*</);
  });

  it.each(Object.keys(components))('%s compiles object and function props to their constructors', (file) => {
    for (const [key, option] of Object.entries(components[file].default.props ?? {})) {
      const want = /^on[A-Z]/.test(key) ? ['Function'] : expected[key];
      if (want) expect(typeNames(option), `${file} prop ${key}`).toEqual(want);
    }
  });
});
