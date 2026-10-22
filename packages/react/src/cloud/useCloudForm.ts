import type { CloudSubmission, DraftStore, PublishedForm } from '@formhaus/core/cloud';
import { cloudStateFor, createCloudController } from '@formhaus/core/internal';
import { type RefObject, useCallback, useEffect, useRef, useState } from 'react';

interface CloudFormOptions {
  id: string;
  apiBase?: string;
  initialForm?: PublishedForm;
  draftStore?: DraftStore | false;
  draftExclude?: string[];
  extraBody: () => Record<string, unknown>;
  challengeHost: RefObject<HTMLElement | null>;
  onSuccess?: (submission: CloudSubmission) => void;
  onError?: (error: unknown) => void;
}

export function useCloudForm({
  id,
  apiBase,
  initialForm,
  draftStore,
  draftExclude,
  extraBody,
  challengeHost,
  onSuccess,
  onError,
}: CloudFormOptions) {
  const [state, setState] = useState(() => cloudStateFor(initialForm));
  const controller = useRef<ReturnType<typeof createCloudController> | null>(null);
  const wanted = useRef(false);
  const callbacks = useRef({ onSuccess, onError, extraBody, initialForm, draftStore, draftExclude });
  callbacks.current = { onSuccess, onError, extraBody, initialForm, draftStore, draftExclude };

  useEffect(() => {
    const { initialForm: form, draftStore: store, draftExclude: exclude } = callbacks.current;
    setState(cloudStateFor(form));
    const current = createCloudController(
      {
        id,
        apiBase,
        initialForm: form,
        draftStore: store,
        draftExclude: exclude,
        extraBody: () => callbacks.current.extraBody(),
        challengeHost: () => challengeHost.current,
      },
      {
        onChange: setState,
        onSuccess: (submission) => callbacks.current.onSuccess?.(submission),
        onError: (error) => callbacks.current.onError?.(error),
      },
    );
    controller.current = current;
    current.start();
    if (wanted.current) current.warm();
    return () => current.dispose();
  }, [id, apiBase]);

  const submit = useCallback(
    (values: Record<string, unknown>, skippedSteps?: string[]) => controller.current!.submit(values, skippedSteps),
    [],
  );
  const retry = useCallback(() => controller.current!.start(), []);
  const again = useCallback(() => controller.current!.again(), []);
  const relay = useCallback((error: unknown) => controller.current?.relay(error), []);
  const saveDraft = useCallback((values: Record<string, unknown>) => controller.current?.saveDraft(values), []);
  const warm = useCallback(() => {
    wanted.current = true;
    controller.current?.warm();
  }, []);

  return { ...state, submit, retry, again, relay, saveDraft, warm };
}
