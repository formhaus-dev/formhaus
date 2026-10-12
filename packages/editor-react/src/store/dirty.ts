import { useDeferredValue, useMemo } from 'react';
import { baselineOf, formKey } from './baseline';
import { useEditorHandle } from './context';
import { useForm } from './hooks';

export function useDirty(): boolean {
  const { published } = useEditorHandle();
  const baseline = useMemo(() => baselineOf(published), [published]);
  const form = useDeferredValue(useForm());
  return useMemo(() => baseline === null || formKey(form) !== baseline, [form, baseline]);
}
