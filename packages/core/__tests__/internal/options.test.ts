import { describe, expect, it, vi } from 'vitest';
import { type FieldOption, type FormDefinition, FormEngine } from '../../src';
import { imageSource, loadOptions, type OptionsProvider, optionSources, optionTexts, watchOptions } from '../../src/internal';

const unique = (texts: string[]) => new Set(texts).size === texts.length;

describe('optionTexts', () => {
  it('keeps unique labels', () => {
    expect(
      optionTexts([
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
      ]),
    ).toEqual(['A', 'B']);
  });

  it('adds the value to a repeated label', () => {
    expect(
      optionTexts([
        { value: 'b', label: 'A' },
        { value: 'c', label: 'A' },
      ]),
    ).toEqual(['A (b)', 'A (c)']);
  });

  it('numbers options that share both label and value', () => {
    const options = Array.from({ length: 3 }, () => ({ value: 'b', label: 'A' }));
    expect(optionTexts(options)).toEqual(['A (b) (1)', 'A (b) (2)', 'A (b) (3)']);
  });

  it('numbers a label that matches a text with a value', () => {
    expect(
      optionTexts([
        { value: 'b', label: 'A' },
        { value: 'c', label: 'A' },
        { value: 'd', label: 'A (b)' },
      ]),
    ).toEqual(['A (b) (1)', 'A (c)', 'A (b) (2)']);
  });

  it('skips numbered texts that a label already uses', () => {
    const texts = optionTexts([
      { value: 'b', label: 'A' },
      { value: 'b', label: 'A' },
      { value: 'e', label: 'A (b) (1)' },
    ]);
    expect(texts).toEqual(['A (b) (2)', 'A (b) (3)', 'A (b) (1)']);
  });

  it('returns unique texts for many identical options', () => {
    const options = Array.from({ length: 5000 }, () => ({ value: 'x', label: 'X' }));
    expect(unique(optionTexts(options))).toBe(true);
  });
});

describe('imageSource', () => {
  it('keeps relative, blob, http, https and raster data images', () => {
    const allowed = [
      '/assets/a.png',
      './a@2x.png',
      'a.png',
      '//cdn.example.com/a.png',
      'blob:https://example.com/3f1c',
      'http://localhost:5173/a.png',
      'HTTPS://example.com/a@b.png?x=1',
      'data:image/png;base64,iVBORw0KGgo=',
      'data:image/webp,x',
    ];
    expect(allowed.map(imageSource)).toEqual(allowed);
  });

  it('drops script, file, non-raster data and credential URLs', () => {
    const refused = [
      undefined,
      '',
      ' ',
      'javascript:alert(1)',
      ' JaVa\tScRiPt:alert(1)',
      '\u0001javascript:alert(1)',
      'vbscript:msgbox(1)',
      'data:text/html,<script>',
      'data:image/svg+xml;base64,PHN2Zz4=',
      'file:///etc/hosts',
      'https://user:pass@example.com/a.png',
      'http:user@example.com/a.png',
      '//user@example.com/a.png',
    ];
    expect(refused.map(imageSource)).toEqual(refused.map(() => undefined));
  });
});

describe('watchOptions', () => {
  const definition: FormDefinition = {
    formatVersion: '1.1',
    id: 'trip',
    title: '',
    submit: { label: 'Send' },
    fields: [
      { key: 'country', type: 'text', label: 'Country' },
      { key: 'city', type: 'select', label: 'City', optionsFrom: 'cities', optionsDependsOn: ['country'] },
      { key: 'stops', type: 'group', label: 'Stops', fields: [{ key: 'stop', type: 'select', label: 'Stop', optionsFrom: 'cities' }] },
    ],
  };
  const oslo = [{ value: 'oslo', label: 'Oslo' }];
  const rome = [{ value: 'rome', label: 'Rome' }];
  const flush = () => new Promise((done) => setTimeout(done));

  function start(cities: OptionsProvider) {
    const engine = new FormEngine(definition);
    const commit = vi.fn();
    const busy: Record<string, boolean> = {};
    const stop = watchOptions(engine, optionSources(definition.fields!), { cities }, commit, (key, loading) => {
      busy[key] = loading;
    });
    return { engine, commit, busy, stop };
  }

  function pending() {
    const calls: { resolve: (options: FieldOption[]) => void; reject: () => void }[] = [];
    const provider = () =>
      new Promise<FieldOption[]>((resolve, reject) => {
        calls.push({ resolve, reject });
      });
    return { calls, provider };
  }

  it('reports a source busy until its options arrive', async () => {
    const { calls, provider } = pending();
    const { engine, commit, busy } = start(provider);
    expect(busy).toEqual({ city: true, 'stops.stop': true });
    calls[0].resolve(oslo);
    await flush();
    expect(busy).toEqual({ city: false, 'stops.stop': true });
    expect(commit).toHaveBeenCalledWith('city', oslo);
    expect(engine.fieldLoading).toEqual({});
  });

  it('ignores a stale call and clears busy when the latest call settles', async () => {
    const { calls, provider } = pending();
    const { engine, commit, busy } = start(provider);
    engine.setValue('country', 'it');
    calls[0].resolve(oslo);
    await flush();
    expect(busy.city).toBe(true);
    calls[2].resolve(rome);
    await flush();
    expect(busy.city).toBe(false);
    expect(commit.mock.calls).toEqual([['city', rome]]);
  });

  it('clears busy when the provider rejects or throws', async () => {
    const { calls, provider } = pending();
    const { busy } = start(provider);
    calls[0].reject();
    await flush();
    expect(busy.city).toBe(false);
    const failing = start(() => {
      throw new Error('down');
    });
    expect(failing.busy).toEqual({ city: false, 'stops.stop': false });
  });

  it('never reports a synchronous provider busy', () => {
    const { commit, busy } = start(() => oslo);
    expect(busy).toEqual({ city: false, 'stops.stop': false });
    expect(commit).toHaveBeenCalledWith('city', oslo);
  });

  it('clears busy on stop and drops later results', async () => {
    const { calls, provider } = pending();
    const { commit, busy, stop } = start(provider);
    stop();
    expect(busy).toEqual({ city: false, 'stops.stop': false });
    calls[0].resolve(oslo);
    await flush();
    expect(commit).not.toHaveBeenCalled();
  });
});

describe('loadOptions', () => {
  const oslo = [{ value: 'oslo', label: 'Oslo' }];
  const rome = [{ value: 'rome', label: 'Rome' }];
  const flush = () => new Promise((done) => setTimeout(done));

  it('commits a synchronous array', () => {
    const commit = vi.fn();
    loadOptions('city', () => oslo, {}, new Map(), commit);
    expect(commit).toHaveBeenCalledWith('city', oslo);
  });

  it('commits only the latest call', async () => {
    const commit = vi.fn();
    const versions = new Map<string, number>();
    let first: (options: FieldOption[]) => void = () => {};
    loadOptions('city', () => new Promise<FieldOption[]>((resolve) => (first = resolve)), {}, versions, commit);
    loadOptions('city', () => Promise.resolve(rome), {}, versions, commit);
    first(oslo);
    await flush();
    expect(commit.mock.calls).toEqual([['city', rome]]);
  });

  it('ignores a rejected promise and a throwing provider', async () => {
    const commit = vi.fn();
    loadOptions('city', () => Promise.reject(new Error('down')), {}, new Map(), commit);
    loadOptions(
      'city',
      () => {
        throw new Error('down');
      },
      {},
      new Map(),
      commit,
    );
    await flush();
    expect(commit).not.toHaveBeenCalled();
  });
});
