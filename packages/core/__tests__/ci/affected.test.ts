import { describe, expect, it } from 'vitest';
import { classify, contentTests, detect, FLAGS, sourceRefs } from '../../../../scripts/ci-affected.mjs';

const everything = Object.fromEntries(FLAGS.map((flag: string) => [flag, true]));
const only = (...names: string[]) => Object.fromEntries(FLAGS.map((flag: string) => [flag, names.includes(flag)]));

describe('ci affected checks', () => {
  it('runs only content checks for template changes', () => {
    expect(classify(['templates/contact.json', 'templates/index.json'])).toEqual(only('templates'));
  });

  it('runs package checks and lowest peers for a vue change', () => {
    expect(classify(['packages/vue/src/FormRenderer.vue'])).toEqual(only('code', 'peers'));
  });

  it('runs package checks and the audit for a package manifest change', () => {
    expect(classify(['packages/figma/package.json'])).toEqual(only('code', 'deps'));
  });

  it('runs everything for root files and unknown paths', () => {
    expect(classify(['README.md'])).toEqual(everything);
    expect(classify(['docs/guide/intro.md', 'scripts/check-seo.mjs'])).toEqual(everything);
  });

  it('runs everything for an empty diff', () => {
    expect(classify([])).toEqual(everything);
  });

  it('runs everything for content that package sources import', () => {
    expect(sourceRefs()).toContain('examples/definitions/basic-form.json');
    expect(sourceRefs()).toContain('docs/migrate/0.11.md');
    expect(classify(['examples/definitions/basic-form.json'])).toEqual(everything);
  });

  it('runs everything outside pull requests', () => {
    expect(detect({ event: 'push', base: 'HEAD^1' })).toEqual(everything);
  });

  it('runs everything when the base cannot be diffed', () => {
    expect(detect({ event: 'pull_request', base: '0000000000000000000000000000000000000000' })).toEqual(everything);
  });

  it('selects the tests that read docs, templates and examples', () => {
    const tests = contentTests();
    expect(tests).toContain('packages/core/__tests__/templates/templates.test.ts');
    expect(tests).toContain('packages/core/__tests__/docs/question-timing.test.ts');
    expect(tests).toContain('packages/react/__tests__/FormRenderer.submit-results.test.tsx');
    expect(tests).toContain('packages/vue/__tests__/FormRenderer.submit-results.test.ts');
    expect(tests).toContain('packages/figma/src/__tests__/parse-routing.test.ts');
    expect(tests).toContain('packages/builder/__tests__/roundtrip.test.ts');
    expect(tests).not.toContain('packages/core/__tests__/engine/exclusive.test.ts');
  });
});
