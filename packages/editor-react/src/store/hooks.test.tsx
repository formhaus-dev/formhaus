import { addField, setKey, setLabel, setLogic } from '@formhaus/builder';
import { act, render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { LogicBadge } from '../logic/LogicBadge';
import { testHost } from '../test/host';
import { EditorContext } from './context';
import { useErrors, useField } from './hooks';
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

function twoFields() {
  const store = createEditorStore(blankForm());
  const second = store.update((form) => addField(form, { step: null }).uid) ?? '';
  const first = store.getState().form.blocks[0]?.uid ?? '';
  return { store, first, second };
}

const provider = (store: ReturnType<typeof createEditorStore>) =>
  function Provider({ children }: { children: ReactNode }) {
    return <EditorContext.Provider value={{ store, autosave: null, host: testHost(), published: null }}>{children}</EditorContext.Provider>;
  };

describe('useErrors', () => {
  it('keeps the same list until the field errors change', () => {
    const { store, first, second } = twoFields();
    const lists: string[][] = [];
    function Probe() {
      lists.push(useErrors(first));
      return null;
    }
    render(<Probe />, { wrapper: provider(store) });
    act(() => {
      store.update((form) => {
        setLabel(form, second, 'Company');
      });
    });
    expect(lists).toHaveLength(1);
    act(() => {
      store.update((form) => {
        setKey(form, first, '');
      });
    });
    expect(lists).toHaveLength(2);
    expect(lists[1]).toEqual(['Response key is empty.']);
  });
});

describe('LogicBadge', () => {
  it('follows the label of the field it depends on', () => {
    const { store, first, second } = twoFields();
    act(() => {
      store.update((form) => {
        setLabel(form, first, 'Plan');
        const key = form.blocks[0]?.kind === 'question' ? form.blocks[0].key : '';
        setLogic(form, second, 'all', [{ field: key, operator: 'notEmpty', value: '' }]);
      });
    });
    function Badge() {
      const field = useField(second);
      return field ? <LogicBadge block={field} onOpen={() => undefined} /> : null;
    }
    const view = render(<Badge />, { wrapper: provider(store) });
    expect(view.getByRole('button')).toHaveTextContent('Shown when Plan');
    act(() => {
      store.update((form) => {
        setLabel(form, first, 'Pricing plan');
      });
    });
    expect(view.getByRole('button')).toHaveTextContent('Shown when Pricing plan');
    act(() => {
      store.update((form) => {
        setLogic(form, second, 'always', []);
      });
    });
    expect(view.queryByRole('button')).toBeNull();
  });
});
