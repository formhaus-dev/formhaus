import { fireEvent, render, screen, waitFor } from '@testing-library/vue';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { type PropType, defineComponent, h } from 'vue';
import { FormActions } from '../src';
import { type CloudNotice, type CloudNoticeActionFn, FormhausForm } from '../src/cloud';

const definition: FormDefinition = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [{ key: 'email', type: 'text', label: 'Email' }],
};

const initialForm = { definition };

function reply(status: number, body: unknown) {
  return { ok: status < 400, status, json: async () => body };
}

function stub(...replies: Array<ReturnType<typeof reply> | Error>) {
  const queue = [...replies];
  const fetchMock = vi.fn(async () => {
    const next = queue.shift()!;
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const send = () => fireEvent.click(screen.getByRole('button', { name: 'Send' }));
const precedes = (a: Element, b: Element) => !!(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

afterEach(() => vi.unstubAllGlobals());

it('replaces the notice with the notice slot, passes the code and focuses a marked element', async () => {
  stub(new TypeError('Failed to fetch'), reply(201, { id: 's1', values: {} }));
  const seen: CloudNotice[] = [];
  render(FormhausForm, {
    props: { id: 'abc', initialForm },
    slots: {
      notice: ({ notice, onAction }: { notice: CloudNotice; onAction: CloudNoticeActionFn }) => {
        seen.push(notice);
        return h('div', { 'data-fh-notice': '', tabindex: -1 }, [
          h('span', notice.code),
          h('button', { type: 'button', onClick: () => onAction('retry') }, 'Again'),
        ]);
      },
    },
  });
  await send();
  expect(await screen.findByText('network')).toBeDefined();
  expect(document.querySelector('.fh-form__notice')).toBeNull();
  expect(seen[0]).toMatchObject({ tone: 'error', code: 'network', action: 'retry' });
  await waitFor(() => expect(document.activeElement?.hasAttribute('data-fh-notice')).toBe(true));
  await new Promise((resolve) => setTimeout(resolve));
  await fireEvent.click(screen.getByRole('button', { name: 'Again' }));
  expect(await screen.findByRole('status')).toBeDefined();
});

it('focuses the first invalid field when a replaced notice has no marker', async () => {
  stub(reply(422, { errors: { email: 'Taken' } }));
  render(FormhausForm, { props: { id: 'abc', initialForm }, slots: { notice: () => h('p', 'Custom') } });
  await send();
  expect(await screen.findByText('Taken')).toBeDefined();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Email')));
});

it('focuses the first invalid field when a marked notice cannot take focus', async () => {
  stub(reply(422, { errors: { email: 'Taken', ghost: 'Unknown' } }));
  render(FormhausForm, {
    props: { id: 'abc', initialForm },
    slots: { notice: ({ notice }: { notice: CloudNotice }) => h('div', { 'data-fh-notice': '' }, notice.details) },
  });
  await send();
  expect(await screen.findByText('Unknown')).toBeDefined();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Email')));
});

it('renders the notice by the actions with noticePlacement actions', async () => {
  stub(reply(429, { error: 'rate_limited' }));
  render(FormhausForm, { props: { id: 'abc', initialForm, noticePlacement: 'actions' } });
  await send();
  const text = await screen.findByText('Too many attempts. Wait a minute and try again.');
  const notice = text.closest('.fh-form__notice')!;
  expect(precedes(screen.getByLabelText('Email'), notice)).toBe(true);
  expect(precedes(notice, screen.getByRole('button', { name: 'Send' }))).toBe(true);
  await waitFor(() => expect(document.activeElement).toBe(notice));
});

it('passes the notice and its action to an actions component that declares notice', async () => {
  stub(reply(503, { error: 'unavailable' }), reply(201, { id: 's1', values: {} }));
  const Actions = defineComponent({
    inheritAttrs: false,
    props: { notice: Object as PropType<CloudNotice | null> },
    emits: ['noticeAction'],
    setup(props, { attrs, emit }) {
      return () => [
        props.notice && h('button', { type: 'button', onClick: () => emit('noticeAction', 'retry') }, props.notice.code),
        h(FormActions, attrs),
      ];
    },
  });
  render(FormhausForm, { props: { id: 'abc', initialForm, actionsComponent: Actions }, slots: { notice: () => [] } });
  await send();
  const retry = await screen.findByRole('button', { name: 'unavailable' });
  await new Promise((resolve) => setTimeout(resolve));
  await fireEvent.click(retry);
  expect(await screen.findByRole('status')).toBeDefined();
});

it('keeps the notice off actions components that do not declare it', async () => {
  stub(reply(503, { error: 'unavailable' }));
  const Actions = defineComponent({
    setup(_, { attrs }) {
      return () => h('div', { class: 'mine' }, [h(FormActions, attrs)]);
    },
  });
  render(FormhausForm, { props: { id: 'abc', initialForm, actionsComponent: Actions } });
  await send();
  expect(await screen.findByText('Something went wrong. Try again.')).toBeDefined();
  expect(document.querySelector('.mine')?.hasAttribute('notice')).toBe(false);
});

it('translates notice texts and buttons with a cloudLabels catalog', async () => {
  stub(reply(409, { error: 'verification_required' }));
  render(FormhausForm, {
    props: { id: 'abc', initialForm, cloudLabels: { verification_required: 'Bitte neu laden.', reload: 'Neu laden' } },
  });
  await send();
  expect(await screen.findByText('Bitte neu laden.')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Neu laden' })).toBeDefined();
});

it('translates with a cloudLabels function and keeps English for missing keys', async () => {
  stub(reply(0, null), reply(201, { id: 's1', values: {} }));
  const labels = vi.fn((key: string) => (key === 'retry' ? 'Erneut' : undefined));
  render(FormhausForm, { props: { id: 'abc', initialForm: { definition, settings: { allowAnother: true } }, cloudLabels: labels } });
  await send();
  expect(await screen.findByText('Could not reach the form server. Check your connection and try again.')).toBeDefined();
  await new Promise((resolve) => setTimeout(resolve));
  await fireEvent.click(screen.getByRole('button', { name: 'Erneut' }));
  expect(await screen.findByText('Thank you. Your response was submitted.')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Submit another response' })).toBeDefined();
  expect(labels).toHaveBeenCalledWith('network');
});

it('translates the load error and its retry button', async () => {
  stub(reply(503, { error: 'unavailable' }));
  render(FormhausForm, { props: { id: 'abc', cloudLabels: { unavailable: 'Nicht erreichbar', retry: 'Erneut' } } });
  expect(await screen.findByText('Nicht erreichbar')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Erneut' })).toBeDefined();
});

it('translates the default success texts', async () => {
  stub(reply(201, { id: 's1', values: {} }));
  render(FormhausForm, {
    props: {
      id: 'abc',
      initialForm: { definition, settings: { allowAnother: true } },
      cloudLabels: { submitted: 'Danke', submitAnother: 'Noch eine Antwort' },
    },
  });
  await send();
  expect(await screen.findByText('Danke')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Noch eine Antwort' })).toBeDefined();
});

it('reports a cloud failure to onError once and errors of its own hooks too', async () => {
  stub(reply(409, { error: 'paused' }));
  const onError = vi.fn();
  const hook = new Error('hook failed');
  const { rerender } = render(FormhausForm, { props: { id: 'abc', initialForm, onError } });
  await send();
  expect(await screen.findByText('This form is paused.')).toBeDefined();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'paused' }));
  await rerender({
    onBeforeSubmit: () => {
      throw hook;
    },
  });
  await send();
  await waitFor(() => expect(onError).toHaveBeenCalledWith(hook));
  expect(onError).toHaveBeenCalledTimes(2);
});

it('renders on the server with a custom notice and actions placement', async () => {
  const { createSSRApp } = await import('vue');
  const { renderToString } = await import('vue/server-renderer');
  const app = createSSRApp({
    render: () =>
      h(
        FormhausForm,
        { id: 'abc', initialForm, noticePlacement: 'actions' },
        { notice: ({ notice }: { notice: CloudNotice }) => h('p', notice.code) },
      ),
  });
  const html = await renderToString(app);
  expect(html).toContain('Email');
  expect(html).toContain('Send');
});
