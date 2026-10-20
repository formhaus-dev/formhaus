import type { FormDefinition } from '../types';
import { carryValues, splitErrors, updatedErrors } from './carry';
import { createChallengeFrame, type ChallengeHost, type CloudChallengeFrame } from './challenge';
import { createFileUploader, createSubmitter, fetchForm, type CloudClientOptions, type CloudSubmission } from './client';
import { draftValues, sessionDraftStore, type DraftStore } from './draft';
import { parseSettings, withEnding, type CloudChallenge, type CloudSettings, type PublishedForm } from './envelope';
import { CloudError, networkError } from './error';
import { FORM_UPDATED_MESSAGE, failureFor, type CloudAction } from './failures';
import { uploadGone } from './files';

export interface CloudNotice {
  tone: 'error' | 'info';
  message: string;
  action: CloudAction;
  details: string[];
}

export interface CloudState {
  definition: FormDefinition | null;
  version: number | null;
  settings: CloudSettings;
  challenge: CloudChallenge | null;
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

export interface CloudControllerOptions extends CloudClientOptions {
  initialForm?: PublishedForm;
  extraBody?: () => Record<string, unknown>;
  draftStore?: DraftStore | false;
  draftExclude?: readonly string[];
  challengeHost?: () => ChallengeHost | null;
}

export const initialCloudState: CloudState = {
  definition: null,
  version: null,
  settings: {},
  challenge: null,
  loadError: null,
  errors: {},
  notice: null,
  initialValues: null,
  revision: 0,
  attempt: 0,
  done: false,
};

export function cloudStateFor(form?: PublishedForm): CloudState {
  if (!form) return initialCloudState;
  return {
    ...initialCloudState,
    definition: form.definition,
    version: form.version ?? null,
    settings: parseSettings(form.settings),
    challenge: form.challenge ?? null,
  };
}

function errorNotice(error: CloudError, details: string[] = []): CloudNotice {
  return { tone: 'error', message: error.message, action: error.action, details };
}

export function createCloudController(options: CloudControllerOptions, callbacks: CloudCallbacks) {
  const controller = new AbortController();
  const drafts = options.draftStore === false ? undefined : (options.draftStore ?? sessionDraftStore());
  let firstRenderToken: string | undefined;
  const submitterFor = (form: PublishedForm) => {
    firstRenderToken ??= form.renderToken;
    const first = firstRenderToken === form.renderToken ? undefined : firstRenderToken;
    return createSubmitter({ ...options, version: form.version, renderToken: form.renderToken, firstRenderToken: first });
  };
  let submitter = createSubmitter(options);
  const upload = createFileUploader(options);
  let initial = options.initialForm;
  const alive = () => !controller.signal.aborted;
  let state = initialCloudState;
  let settings = state.settings;
  let frame: CloudChallengeFrame | undefined;
  let framed = '';
  const configOf = (c: CloudChallenge | null) => `${c?.provider} ${c?.siteKey} ${c?.url}`;
  const challenge = () => {
    if (!state.challenge || !options.challengeHost) return undefined;
    framed = configOf(state.challenge);
    return (frame ??= createChallengeFrame({ challenge: state.challenge, formId: options.id, host: options.challengeHost }));
  };
  const update = (patch: Partial<CloudState>) => {
    state = { ...state, ...patch };
    if (frame && configOf(state.challenge) !== framed) {
      frame.dispose();
      frame = undefined;
    }
    callbacks.onChange(state);
  };
  const report = (patch: Partial<CloudState>) => update({ ...patch, attempt: state.attempt + 1 });

  function show(form: PublishedForm) {
    submitter = submitterFor(form);
    const draft = drafts?.load(options.id, form.version) ?? null;
    const next = cloudStateFor(form);
    settings = next.settings;
    update({ ...next, revision: state.revision + (draft ? 1 : 0), attempt: state.attempt, initialValues: draft });
  }

  async function refresh(error: CloudError, sent: Record<string, unknown>) {
    const before = state.definition;
    try {
      const next = await fetchForm({ ...options, signal: controller.signal, version: error.version });
      if (!alive()) return;
      if (next.version === undefined || next.version < (error.version ?? 0)) throw new CloudError({ status: 409, code: 'form_updated' });
      const kept = before ? carryValues(sent, next.definition, before) : {};
      submitter = submitterFor(next);
      report({
        definition: next.definition,
        version: next.version,
        settings: (settings = parseSettings(next.settings)),
        challenge: next.challenge ?? null,
        initialValues: kept,
        revision: state.revision + 1,
        errors: updatedErrors(next.definition, sent, kept, error.errors ?? {}),
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
      if (state.loadError) update({ loadError: null });
      if (initial) {
        show(initial);
        initial = undefined;
        return;
      }
      fetchForm({ ...options, signal: controller.signal }).then(
        (form) => {
          if (alive()) show(form);
        },
        (error: Error) => {
          if (!alive()) return;
          update({ loadError: error });
          callbacks.onError?.(error);
        },
      );
    },
    dispose() {
      controller.abort();
      frame?.dispose();
    },
    warm() {
      challenge()?.warm();
    },
    saveDraft(values: Record<string, unknown>) {
      if (state.definition && !state.done)
        drafts?.save(options.id, state.version ?? undefined, draftValues(state.definition, values, options.draftExclude));
    },
    again() {
      update({ done: false, settings, errors: {}, notice: null, initialValues: null, revision: state.revision + 1 });
    },
    async submit(values: Record<string, unknown>, skippedSteps?: string[]) {
      if (state.notice) update({ notice: null });
      const check = challenge();
      const attempt = async (retried?: boolean): Promise<void> => {
        let sending = false;
        try {
          const sent = state.definition ? await upload.upload(state.definition, values, controller.signal) : values;
          if (!alive()) return;
          const token = await check?.token();
          sending = true;
          const submission = await submitter(sent, { skippedSteps, challengeToken: token });
          check?.spend();
          if (!alive()) return;
          drafts?.clear(options.id);
          update({ done: true, settings: withEnding(settings, submission.ending) });
          callbacks.onSuccess?.(submission);
        } catch (error) {
          const cloud = error as CloudError;
          if (cloud.code === 'verification_failed') check?.spend();
          upload.forget(values, Object.keys(cloud.errors ?? {}));
          if (!alive()) throw error;
          if (sending && !retried && cloud.status === 422 && state.definition && uploadGone(state.definition, values, cloud.errors)) {
            check?.spend();
            return attempt(true);
          }
          await fail(error, values);
          callbacks.onError?.(error);
          throw error;
        }
      };
      return attempt();
    },
  };
}
