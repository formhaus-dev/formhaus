import { createCloudController, initialCloudState, type CloudSubmission } from '@formhaus/core/cloud';
import { useCallback, useEffect, useRef, useState } from 'react';

interface CloudFormOptions {
  id: string;
  apiBase?: string;
  onSuccess?: (submission: CloudSubmission) => void;
  onError?: (error: unknown) => void;
}

export function useCloudForm({ id, apiBase, onSuccess, onError }: CloudFormOptions) {
  const [state, setState] = useState(initialCloudState);
  const controller = useRef<ReturnType<typeof createCloudController> | null>(null);
  const callbacks = useRef({ onSuccess, onError });
  callbacks.current = { onSuccess, onError };

  useEffect(() => {
    setState(initialCloudState);
    const current = createCloudController({ id, apiBase }, {
      onChange: setState,
      onSuccess: (submission) => callbacks.current.onSuccess?.(submission),
      onError: (error) => callbacks.current.onError?.(error),
    });
    controller.current = current;
    current.start();
    return () => current.dispose();
  }, [id, apiBase]);

  const submit = useCallback((values: Record<string, unknown>, skippedSteps?: string[]) => (
    controller.current!.submit(values, skippedSteps)
  ), []);

  return { ...state, submit };
}
