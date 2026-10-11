import { afterEach, describe, expect, it, vi } from 'vitest';
import { CloudError, createCloudController, createSubmitter, focusProblem, type CloudState } from '../../src/cloud';
import { carryValues } from '../../src/cloud/carry';
import { fetchPublished } from '../../src/cloud/client';
import { failureFor } from '../../src/cloud/failures';
import type { FormDefinition } from '../../src';

const options = [{ value: 'bug', label: 'Bug' }, { value: 'idea', label: 'Idea' }];

const v1: FormDefinition = {
  id: 'feedback', title: 'Feedback', submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    { key: 'topic', type: 'radio', label: 'Topic', options },
    { key: 'agree', type: 'checkbox', label: 'Agree' },
  ],
};

const v2: FormDefinition = {
  ...v1,
  fields: [
    { key: 'name', type: 'textarea', label: 'Name' },
    { key: 'topic', type: 'multiselect', label: 'Topic', options, validation: { required: true } },
    { key: 'agree', type: 'switch', label: 'Agree' },
    { key: 'plan', type: 'select', label: 'Plan', options: [{ value: 'idea', label: 'Idea' }] },
  ],
};

function reply(status: number, body: unknown, version?: number) {
  return { ok: status < 400, status, json: async () => body, headers: { get: (name: string) => (name === 'Formhaus-Version' && version ? String(version) : null) } };
}

afterEach(() => vi.unstubAllGlobals());

describe('failure messages', () => {
  it.each([
    [0, 'network', 'Could not reach the form server', 'retry'],
    [0, 'timeout', 'did not respond', 'retry'],
    [200, 'invalid_response', 'Something went wrong', 'retry'],
    [400, 'malformed_body', 'Reload the page', 'reload'],
    [402, 'limit_reached', 'not accepting responses', null],
    [404, 'not_found', 'no longer exists', null],
    [409, 'paused', 'paused', null],
    [409, 'unknown', 'paused', null],
    [409, 'idempotency_key_reused', 'changed while', 'retry'],
    [410, 'expired', 'expired', null],
    [413, 'body_too_large', 'too long', null],
    [429, 'rate_limited', 'Too many attempts', 'retry'],
    [500, 'internal', 'Something went wrong', 'retry'],
    [502, 'unknown', 'Something went wrong', 'retry'],
    [503, 'unavailable', 'Something went wrong', 'retry'],
  ])('%i %s', (status, code, text, action) => {
    const error = new CloudError(status, code);
    expect(error.message).toContain(text);
    expect(error.action).toBe(action);
    expect(error.retryable).toBe(action === 'retry');
    expect(failureFor(status, code).message).toBe(error.message);
  });
});

describe('versions', () => {
  it('reads the version header and busts the cache after an update', async () => {
    const fetchMock = vi.fn().mockResolvedValue(reply(200, v2, 2));
    vi.stubGlobal('fetch', fetchMock);
    await expect(fetchPublished({ id: 'abc' }, undefined, 2)).resolves.toEqual({ definition: v2, version: 2 });
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.formhaus.dev/f/abc/definition?v=2');
  });

  it('sends the version and wraps network failures', async () => {
    const fetchMock = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValue(reply(201, { id: 's', values: {} }));
    vi.stubGlobal('fetch', fetchMock);
    const submit = createSubmitter({ id: 'abc', version: 3 });
    await expect(submit({ name: 'Ada' }, [])).rejects.toMatchObject({ status: 0, code: 'network', retryable: true });
    await submit({ name: 'Ada' }, []);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ values: { name: 'Ada' }, skippedSteps: [], version: 3 });
    expect(fetchMock.mock.calls[0][1].headers['Idempotency-Key']).toBe(fetchMock.mock.calls[1][1].headers['Idempotency-Key']);
  });

  it('carries values whose key and type still fit', () => {
    expect(carryValues({ name: 'Ada', topic: 'bug', agree: true, plan: 'bug', gone: 'x' }, v2, v1)).toEqual({ name: 'Ada', agree: true });
    expect(carryValues({ topic: ['bug', 'nope'] }, v2)).toEqual({});
  });
});

describe('controller', () => {
  function setup(...replies: ReturnType<typeof reply>[]) {
    const fetchMock = vi.fn();
    replies.forEach((next) => fetchMock.mockResolvedValueOnce(next));
    vi.stubGlobal('fetch', fetchMock);
    const states: CloudState[] = [];
    const controller = createCloudController({ id: 'abc' }, { onChange: (state) => states.push(state) });
    controller.start();
    return { fetchMock, states, controller, last: () => states.at(-1)! };
  }

  it('refreshes the definition on form_updated and keeps compatible values', async () => {
    const { fetchMock, controller, last } = setup(
      reply(200, v1, 1),
      reply(409, { error: 'form_updated', version: 2, errors: { topic: 'Must be a list', name: 'Too long' } }),
      reply(200, v2, 2),
    );
    await vi.waitFor(() => expect(last().version).toBe(1));
    await expect(controller.submit({ name: 'Ada', topic: 'bug' })).rejects.toMatchObject({ code: 'form_updated' });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).version).toBe(1);
    expect(last()).toMatchObject({
      definition: v2, version: 2, revision: 1, initialValues: { name: 'Ada' }, errors: { name: 'Too long', topic: 'Please answer again.' },
      notice: { tone: 'info', message: 'This form was updated. Please review your answers and submit again.' },
    });
  });

  it('asks for a reload when the served definition is older than the 409 version', async () => {
    const { controller, last } = setup(reply(200, v1, 1), reply(409, { error: 'form_updated', version: 3, errors: {} }), reply(200, v2, 2));
    await vi.waitFor(() => expect(last().version).toBe(1));
    await expect(controller.submit({ name: 'Ada' })).rejects.toBeInstanceOf(CloudError);
    expect(last()).toMatchObject({ definition: v1, revision: 0, notice: { tone: 'error', action: 'reload' } });
  });

  it('asks for a reload when the new definition cannot be loaded', async () => {
    const { controller, last } = setup(reply(200, v1, 1), reply(409, { error: 'form_updated', version: 2, errors: {} }), reply(503, {}));
    await vi.waitFor(() => expect(last().version).toBe(1));
    await expect(controller.submit({ name: 'Ada' })).rejects.toBeInstanceOf(CloudError);
    expect(last().notice).toMatchObject({ tone: 'error', action: 'reload' });
  });

  it('lists errors for keys the form does not render', async () => {
    const { controller, last } = setup(reply(200, v1, 1), reply(422, { errors: { name: 'Taken', ghost: 'Unknown' } }));
    await vi.waitFor(() => expect(last().definition).toEqual(v1));
    await expect(controller.submit({ name: 'Ada' })).rejects.toBeInstanceOf(CloudError);
    expect(last()).toMatchObject({ errors: { name: 'Taken' }, notice: { tone: 'error', details: ['Unknown'] }, attempt: 1 });
  });

  it('shows a notice for every other failure and clears it on the next submit', async () => {
    const { controller, last } = setup(reply(200, v1, 1), reply(429, { error: 'rate_limited' }), reply(201, { id: 's', values: {} }));
    await vi.waitFor(() => expect(last().definition).toEqual(v1));
    await expect(controller.submit({ name: 'Ada' })).rejects.toBeInstanceOf(CloudError);
    expect(last().notice).toMatchObject({ tone: 'error', action: 'retry', message: 'Too many attempts. Wait a minute and try again.' });
    await controller.submit({ name: 'Ada' });
    expect(last()).toMatchObject({ notice: null, done: true });
  });
});

describe('focusProblem', () => {
  it('focuses the notice first, else the control inside the first invalid group', () => {
    const input = { focus: vi.fn(), matches: () => true, querySelector: () => null };
    const group = { focus: vi.fn(), scrollIntoView: vi.fn(), matches: () => false, querySelector: () => input };
    const root = { querySelector: vi.fn().mockReturnValue(group) };
    const notice = { focus: vi.fn(), scrollIntoView: vi.fn(), matches: () => false, querySelector: () => null };
    focusProblem(root, notice);
    expect(notice.focus).toHaveBeenCalled();
    expect(input.focus).not.toHaveBeenCalled();
    focusProblem(root, null);
    expect(input.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(group.scrollIntoView).toHaveBeenCalled();
  });
});
