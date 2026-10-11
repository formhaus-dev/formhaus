import type { FormDefinition } from '../types';
import { carryValues, splitErrors } from './carry';
import { createSubmitter, fetchPublished, type CloudClientOptions, type CloudSubmission } from './client';
import { CloudError, networkError } from './error';
import { FORM_UPDATED_MESSAGE, failureFor, type CloudAction } from './failures';

export interface CloudNotice {
  tone: 'error' | 'info';
  message: string;
  action: CloudAction;
  details: string[];
}

export interface CloudState {
  definition: FormDefinition | null;
  version: number | null;
  loadError: Error | null;
  errors: Record<string, string>;
  notice: CloudNotice | null;
  initialValues: Record<string, unknown> | null;
  revision: number;
  attempt: number;
  done: boolean;
}

export interface CloudCallbacks {
  onChange(state: CloudState): void;
  onSuccess?(submission: CloudSubmission): void;
  onError?(error: unknown): void;
}

export const initialCloudState: CloudState = {
  definition: null, version: null, loadError: null, errors: {}, notice: null,
  initialValues: null, revision: 0, attempt: 0, done: false,
};

function errorNotice(error: CloudError, details: string[] = []): CloudNotice {
  return { tone: 'error', message: error.message, action: error.action, details };
}

function stillInvalid(errors: Record<string, string>, sent: Record<string, unknown>, kept: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(errors).filter(([key]) => !(key in sent) || key in kept));
}

export function createCloudController(options: CloudClientOptions, callbacks: CloudCallbacks) {
  const controller = new AbortController();
  const submitter = createSubmitter(options);
  const alive = () => !controller.signal.aborted;
  let state = initialCloudState;
  const update = (patch: Partial<CloudState>) => {
    state = { ...state, ...patch };
    callbacks.onChange(state);
  };
  const report = (patch: Partial<CloudState>) => update({ ...patch, attempt: state.attempt + 1 });

  async function refresh(error: CloudError, sent: Record<string, unknown>) {
    const before = state.definition;
    try {
      const next = await fetchPublished(options, controller.signal, error.version);
      if (!alive()) return;
      const kept = before ? carryValues(sent, next.definition, before) : {};
      report({
        definition: next.definition,
        version: next.version ?? error.version ?? null,
        initialValues: kept,
        revision: state.revision + 1,
        errors: splitErrors(next.definition, stillInvalid(error.errors ?? {}, sent, kept)).fields,
        notice: { tone: 'info', message: FORM_UPDATED_MESSAGE, action: null, details: [] },
      });
    } catch {
      if (alive()) report({ notice: { tone: 'error', ...failureFor(409, 'form_updated'), details: [] } });
    }
  }

  async function fail(error: unknown, values: Record<string, unknown>) {
    const cloud = error instanceof CloudError ? error : networkError(error);
    if (cloud.code === 'form_updated' && cloud.version !== undefined) return refresh(cloud, values);
    if (cloud.status !== 422) return report({ notice: errorNotice(cloud) });
    const errors = cloud.errors ?? {};
    const split = state.definition ? splitErrors(state.definition, errors) : { fields: errors, other: [] };
    report({ errors: split.fields, notice: split.other.length > 0 ? errorNotice(cloud, split.other) : null });
  }

  return {
    start() {
      fetchPublished(options, controller.signal).then(
        (published) => { if (alive()) update({ definition: published.definition, version: published.version ?? null }); },
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
      if (state.notice) update({ notice: null });
      try {
        const submission = await submitter(values, skippedSteps, state.version ?? undefined);
        if (!alive()) return;
        update({ done: true });
        callbacks.onSuccess?.(submission);
      } catch (error) {
        if (!alive()) throw error;
        await fail(error, values);
        callbacks.onError?.(error);
        throw error;
      }
    },
  };
}
