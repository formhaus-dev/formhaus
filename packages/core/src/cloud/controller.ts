import type { FormDefinition } from '../types';
import { createSubmitter, fetchDefinition, type CloudClientOptions, type CloudSubmission } from './client';
import { CloudError } from './error';

export interface CloudState {
  definition: FormDefinition | null;
  loadError: Error | null;
  errors: Record<string, string>;
  done: boolean;
}

export interface CloudCallbacks {
  onChange(state: CloudState): void;
  onSuccess?(submission: CloudSubmission): void;
  onError?(error: unknown): void;
}

export const initialCloudState: CloudState = { definition: null, loadError: null, errors: {}, done: false };

export function createCloudController(options: CloudClientOptions, callbacks: CloudCallbacks) {
  const controller = new AbortController();
  const submitter = createSubmitter(options);
  const alive = () => !controller.signal.aborted;
  let state = initialCloudState;
  const update = (patch: Partial<CloudState>) => {
    state = { ...state, ...patch };
    callbacks.onChange(state);
  };

  return {
    start() {
      fetchDefinition(options, controller.signal).then(
        (definition) => { if (alive()) update({ definition }); },
        (error: Error) => {
          if (!alive()) return;
          update({ loadError: error });
          callbacks.onError?.(error);
        },
      );
    },
    dispose() {
      controller.abort();
    },
    async submit(values: Record<string, unknown>, skippedSteps?: string[]) {
      try {
        const submission = await submitter(values, skippedSteps);
        if (!alive()) return;
        update({ done: true });
        callbacks.onSuccess?.(submission);
      } catch (error) {
        if (alive() && error instanceof CloudError && error.errors) update({ errors: error.errors });
        throw error;
      }
    },
  };
}
