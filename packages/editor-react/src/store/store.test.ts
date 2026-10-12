import { addField, removeField, setLabel } from '@formhaus/builder';
import { describe, expect, it } from 'vitest';
import { blankForm } from './initial';
import { createEditorStore } from './store';

describe('createEditorStore', () => {
  it('applies ops immutably and keeps untouched fields by reference', () => {
    const store = createEditorStore(blankForm());
    const first = store.getState().form;
    const uid = store.update((form) => addField(form, { step: null }, { label: 'Email', type: 'email' }).uid);
    const second = store.getState().form;
    expect(second).not.toBe(first);
    expect(second.blocks[0]).toBe(first.blocks[0]);
    expect(Object.isFrozen(second)).toBe(true);
    expect(second.blocks[1]).toMatchObject({ uid, key: 'email' });
  });

  it('coalesces typing in one group into one undo step', () => {
    const store = createEditorStore(blankForm());
    const [field] = store.getState().form.blocks;
    if (!field) throw new Error('missing field');
    for (const label of ['N', 'Na', 'Nam', 'Name']) {
      store.update((form) => {
        setLabel(form, field.uid, label);
      }, `${field.uid}:label`);
    }
    expect(store.getState().canUndo).toBe(true);
    store.undo();
    expect(store.getState().form.blocks[0]).toMatchObject({ label: '' });
    store.redo();
    expect(store.getState().form.blocks[0]).toMatchObject({ label: 'Name' });
  });

  it('clears a selection that undo removes', () => {
    const store = createEditorStore(blankForm());
    const uid = store.update((form) => addField(form, { step: null }).uid) ?? '';
    store.select({ kind: 'field', uid });
    store.undo();
    expect(store.getState().selection).toBeNull();
  });

  it('notifies subscribers and ignores no-op updates', () => {
    const store = createEditorStore(blankForm());
    let calls = 0;
    const stop = store.subscribe(() => (calls += 1));
    const [field] = store.getState().form.blocks;
    store.update((form) => removeField(form, field?.uid ?? ''));
    expect(calls).toBe(0);
    store.select({ kind: 'form' });
    expect(calls).toBe(1);
    stop();
  });

  it('refuses edits when read only', () => {
    const store = createEditorStore(blankForm(), { readOnly: true });
    store.update((form) => addField(form, { step: null }));
    expect(store.getState().form.blocks).toHaveLength(1);
  });
});
