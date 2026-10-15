import type { CloudSubmission, DraftStore, PublishedForm } from '@formhaus/core/cloud';
import { cloudStateFor, createCloudController } from '@formhaus/core/internal';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CloudFormOptions {
  id: string;
  apiBase?: string;
  initialForm?: PublishedForm;
  draftStore?: DraftStore;
  extraBody: () => Record<string, unknown>;
  onSuccess?: (submission: CloudSubmission) => void;
  onError?: (error: unknown) => void;
}

export function useCloudForm({ id, apiBase, initialForm, draftStore, extraBody, onSuccess, onError }: CloudFormOptions) {
  const [state, setState] = useState(() => cloudStateFor(initialForm));
  const controller = useRef<ReturnType<typeof createCloudController> | null>(null);
  const callbacks = useRef({ onSuccess, onError, extraBody, initialForm, draftStore });
  callbacks.current = { onSuccess, onError, extraBody, initialForm, draftStore };

  useEffect(() => {
    const { initialForm: form, draftStore: store } = callbacks.current;
    setState(cloudStateFor(form));
    const current = createCloudController(
      { id, apiBase, initialForm: form, draftStore: store, extraBody: () => callbacks.current.extraBody() },
      {
        onChange: setState,
        onSuccess: (submission) => callbacks.current.onSuccess?.(submission),
        onError: (error) => callbacks.current.onError?.(error),
      },
    );
    controller.current = current;
    current.start();
    return () => current.dispose();
  }, [id, apiBase]);

  const submit = useCallback(
    (values: Record<string, unknown>, skippedSteps?: string[]) => controller.current!.submit(values, skippedSteps),
    [],
  );
  const retry = useCallback(() => controller.current!.start(), []);
  const again = useCallback(() => controller.current!.again(), []);
  const saveDraft = useCallback((values: Record<string, unknown>) => controller.current?.saveDraft(values), []);

  return { ...state, submit, retry, again, saveDraft };
}
