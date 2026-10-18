import { afterEach, describe, expect, it, vi } from 'vitest';
import { createSubmitter, sessionDraftStore, type PublishedForm } from '../../src/cloud';
import { createCloudController, type CloudState } from '../../src/internal';
import type { FormDefinition } from '../../src';

const definition: FormDefinition = {
  id: 'c',
  title: 'C',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'secret', type: 'password', label: 'Secret' },
  ],
};
const form: PublishedForm = { definition, version: 5, settings: { allowAnother: true }, renderToken: 'rt_1' };

function storage() {
  const items = new Map<string, string>();
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => {
      items.set(key, value);
    },
    removeItem: (key: string) => {
      items.delete(key);
    },
  };
}

const created = () => ({ ok: true, status: 201, json: async () => ({ id: 's1', values: {} }) });

afterEach(() => vi.unstubAllGlobals());

describe('cloud protocol', () => {
  it('sends the core version, the render token and extra body fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(created());
    vi.stubGlobal('fetch', fetchMock);
    await createSubmitter({ id: 'abc', version: 5, renderToken: 'rt_1', extraBody: () => ({ _fh_hp: '' }) })({ name: 'Ada' }, []);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`https://api.formhaus.cc/f/abc?core=${__FORMHAUS_CORE_VERSION__}`);
    expect(JSON.parse(init.body)).toEqual({
      attribution: {},
      _fh_hp: '',
      values: { name: 'Ada' },
      skippedSteps: [],
      version: 5,
      _fh_rt: 'rt_1',
    });
  });

  it('renders an initial form without loading and submits with its token', async () => {
    const fetchMock = vi.fn().mockResolvedValue(created());
    vi.stubGlobal('fetch', fetchMock);
    const states: CloudState[] = [];
    const controller = createCloudController({ id: 'abc', initialForm: form }, { onChange: (state) => states.push(state) });
    controller.start();
    expect(states.at(-1)).toMatchObject({ definition, version: 5, settings: { allowAnother: true } });
    await controller.submit({ name: 'Ada' }, []);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)._fh_rt).toBe('rt_1');
    controller.again();
    expect(states.at(-1)).toMatchObject({ done: false, revision: 1 });
  });

  it('shows the ending the server picked', async () => {
    const cases: [unknown, object][] = [
      [{ successMessage: 'Sales will call you.' }, { successMessage: 'Sales will call you.', allowAnother: true }],
      [{ redirectUrl: 'https://example.com/vip' }, { redirectUrl: 'https://example.com/vip', allowAnother: true }],
      [{ redirectUrl: 'javascript:alert(1)' }, { allowAnother: true }],
      [undefined, { successMessage: 'Thanks', redirectUrl: 'https://example.com/thanks', allowAnother: true }],
    ];
    for (const [ending, settings] of cases) {
      const body = { id: 's1', values: {}, ...(ending !== undefined && { ending }) };
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => body }));
      const states: CloudState[] = [];
      const initialForm = {
        ...form,
        settings: { successMessage: 'Thanks', redirectUrl: 'https://example.com/thanks', allowAnother: true },
      };
      const controller = createCloudController({ id: 'abc', initialForm }, { onChange: (state) => states.push(state) });
      controller.start();
      await controller.submit({ name: 'Ada' }, []);
      expect(states.at(-1)).toMatchObject({ done: true });
      expect(states.at(-1)?.settings).toEqual(settings);
    }
  });

  it('sends the first render token alongside the new one after a form refresh', async () => {
    const updated = { ok: false, status: 409, headers: { get: () => null }, json: async () => ({ error: 'form_updated', version: 6 }) };
    const refreshed = {
      ok: true,
      status: 200,
      headers: { get: () => null },
      json: async () => ({ definition, version: 6, renderToken: 'rt_2' }),
    };
    const fetchMock = vi.fn().mockResolvedValueOnce(updated).mockResolvedValueOnce(refreshed).mockResolvedValue(created());
    vi.stubGlobal('fetch', fetchMock);
    const controller = createCloudController({ id: 'abc', initialForm: form, extraBody: () => ({ _fh_hp: '' }) }, { onChange: () => {} });
    controller.start();
    await expect(controller.submit({ name: 'Ada' }, [])).rejects.toMatchObject({ code: 'form_updated' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('_fh_rt_first');
    await controller.submit({ name: 'Ada' }, []);
    expect(JSON.parse(fetchMock.mock.calls[2][1].body)).toMatchObject({ _fh_hp: '', version: 6, _fh_rt: 'rt_2', _fh_rt_first: 'rt_1' });
  });

  it('restores a draft without sensitive fields and clears it after a submission', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(created()));
    const backing = storage();
    const draftStore = sessionDraftStore(1000, () => backing);
    const first = createCloudController({ id: 'abc', initialForm: form, draftStore }, { onChange: () => {} });
    first.start();
    first.saveDraft({ name: 'Ada', secret: 'hunter2' });
    const states: CloudState[] = [];
    const second = createCloudController({ id: 'abc', initialForm: form, draftStore }, { onChange: (state) => states.push(state) });
    second.start();
    expect(states.at(-1)?.initialValues).toEqual({ name: 'Ada' });
    await second.submit({ name: 'Ada' }, []);
    expect(draftStore.load('abc', 5)).toBeNull();
  });

  it('ignores a draft of another version or an expired one', () => {
    const first = storage();
    const store = sessionDraftStore(-1, () => first);
    store.save('abc', 5, { name: 'Ada' });
    expect(store.load('abc', 5)).toBeNull();
    const second = storage();
    const fresh = sessionDraftStore(1000, () => second);
    fresh.save('abc', 4, { name: 'Ada' });
    expect(fresh.load('abc', 5)).toBeNull();
    expect(sessionDraftStore(1000, undefined).load('abc', 5)).toBeNull();
    const blocked = sessionDraftStore(1000, () => {
      throw new Error('SecurityError');
    });
    expect(() => blocked.save('abc', 5, {})).not.toThrow();
    expect(blocked.load('abc', 5)).toBeNull();
  });

  it('drops a redirect URL that is not http or https from an initial form', () => {
    const states: CloudState[] = [];
    const controller = createCloudController(
      { id: 'abc', initialForm: { definition, settings: { redirectUrl: 'javascript:alert(1)', successMessage: 'Hi' } } },
      { onChange: (state) => states.push(state) },
    );
    controller.start();
    expect(states.at(-1)?.settings).toEqual({ successMessage: 'Hi' });
  });
});
