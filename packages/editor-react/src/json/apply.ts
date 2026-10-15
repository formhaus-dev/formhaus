import type { BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { useCallback, useMemo } from 'react';
import { useEditorHandle } from '../store/context';
import { loader } from '../store/initial';
import { plainDefinition, sameDefinition } from './sync';

export function useReplaceDefinition() {
  const { store, published } = useEditorHandle();
  const load = useMemo(() => loader(published), [published]);
  return useCallback(
    (change: (definition: FormDefinition) => FormDefinition) => {
      let form: BuilderForm;
      try {
        form = load(change(plainDefinition(store.getState().form)));
      } catch {
        return false;
      }
      if (sameDefinition(form, store.getState().form)) return false;
      store.replace(form);
      return true;
    },
    [load, store],
  );
}
