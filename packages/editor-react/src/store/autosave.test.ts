import { setLabel, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SaveConflict, type SavedDraft } from '../host';
import { createAutosave, type DraftAdapter } from './autosave';
import { blankForm, loader } from './initial';
import { createEditorStore } from './store';

const draft = (definition: FormDefinition, revision: number): SavedDraft => ({
  definition,
  baseVersion: null,
  revision,
  savedAt: '2026-10-12T10:00:00Z',
  savedBy: 'ana@example.com',
});

function setup(save: DraftAdapter['save']) {
  const store = createEditorStore(blankForm());
  const adapter: DraftAdapter = { save: vi.fn(save) };
  const autosave = createAutosave(store, { adapter, revision: 0, load: loader(null), delay: 1000 });
  autosave.start();
  const uid = store.getState().form.blocks[0]?.uid ?? '';
  const type = (label: string) => {
    store.update((form: BuilderForm) => {
      setLabel(form, uid, label);
    }, `${uid}:label`);
  };
  return { store, adapter, autosave, type };
}

describe('createAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces edits into one save and tracks the revision', async () => {
    const { store, adapter, type } = setup((definition, revision) => Promise.resolve(draft(definition, revision + 1)));
    type('E');
    type('Em');
    expect(store.getState().save.status).toBe('pending');
    await vi.advanceTimersByTimeAsync(1000);
    expect(adapter.save).toHaveBeenCalledTimes(1);
    expect(store.getState().save.status).toBe('saved');
    type('Ema');
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.mocked(adapter.save).mock.calls[1]?.[1]).toBe(1);
  });

  it('saves again when edits land during a save', async () => {
    let release: () => void = () => undefined;
    const { adapter, type, autosave } = setup(
      (definition, revision) =>
        new Promise((resolve) => {
          release = () => {
            resolve(draft(definition, revision + 1));
          };
        }),
    );
    type('A');
    const first = autosave.flush();
    type('AB');
    release();
    await first;
    await vi.advanceTimersByTimeAsync(1000);
    release();
    await vi.advanceTimersByTimeAsync(0);
    expect(adapter.save).toHaveBeenCalledTimes(2);
    expect((vi.mocked(adapter.save).mock.calls[1]?.[0].fields?.[0] as { label?: string } | undefined)?.label).toBe('AB');
  });

  it('stops on conflict and reloads the remote draft on request', async () => {
    const remote = draft({ id: 'x', title: 'Theirs', submit: { label: 'Go' }, fields: [{ key: 'name', type: 'text', label: 'Name' }] }, 7);
    const { store, adapter, autosave, type } = setup(() => Promise.reject(new SaveConflict(remote)));
    type('Mine');
    await autosave.flush();
    expect(store.getState().save).toMatchObject({ status: 'conflict', conflict: remote });
    type('Mine 2');
    await vi.advanceTimersByTimeAsync(2000);
    expect(adapter.save).toHaveBeenCalledTimes(1);
    await autosave.resolve('reload');
    expect(store.getState().form.title).toBe('Theirs');
    expect(store.getState().save.status).toBe('saved');
    store.undo();
    expect(store.getState().form.blocks[0]).toMatchObject({ label: 'Mine 2' });
  });

  it('overwrites with the remote revision', async () => {
    const remote = draft({ id: 'x', title: 'Theirs', submit: { label: 'Go' }, fields: [] }, 7);
    let conflicted = false;
    const { store, adapter, autosave, type } = setup((definition, revision) => {
      if (conflicted) return Promise.resolve(draft(definition, revision + 1));
      conflicted = true;
      return Promise.reject(new SaveConflict(remote));
    });
    type('Mine');
    await autosave.flush();
    await autosave.resolve('overwrite');
    expect(vi.mocked(adapter.save).mock.calls[1]?.[1]).toBe(7);
    expect(store.getState().save.status).toBe('saved');
  });

  it('marks network failures as errors and retries on request', async () => {
    let fail = true;
    const { store, adapter, autosave, type } = setup((definition, revision) =>
      fail ? Promise.reject(new TypeError('offline')) : Promise.resolve(draft(definition, revision + 1)),
    );
    type('A');
    await vi.advanceTimersByTimeAsync(1000);
    expect(store.getState().save.status).toBe('error');
    fail = false;
    autosave.retry();
    await vi.advanceTimersByTimeAsync(0);
    expect(adapter.save).toHaveBeenCalledTimes(2);
    expect(store.getState().save.status).toBe('saved');
  });
});
