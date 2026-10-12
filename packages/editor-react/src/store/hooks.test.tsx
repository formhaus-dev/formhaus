import { addField, setLabel } from '@formhaus/builder';
import { act, render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { testHost } from '../test/host';
import { EditorContext } from './context';
import { useField } from './hooks';
import { blankForm } from './initial';
import { createEditorStore } from './store';

describe('useField', () => {
  it('re-renders only the field that changed', () => {
    const store = createEditorStore(blankForm());
    const second = store.update((form) => addField(form, { step: null }).uid) ?? '';
    const first = store.getState().form.blocks[0]?.uid ?? '';
    const renders: Record<string, number> = {};
    function Probe({ uid }: { uid: string }) {
      const field = useField(uid);
      renders[uid] = (renders[uid] ?? 0) + 1;
      return <span>{field?.label}</span>;
    }
    const view = render(
      <EditorContext.Provider value={{ store, autosave: null, host: testHost(), published: null }}>
        <Probe uid={first} />
        <Probe uid={second} />
      </EditorContext.Provider>,
    );
    act(() => {
      store.update((form) => {
        setLabel(form, second, 'Company');
      });
    });
    expect(view.getByText('Company')).toBeInTheDocument();
    expect(renders[first]).toBe(1);
    expect(renders[second]).toBe(2);
  });
});
