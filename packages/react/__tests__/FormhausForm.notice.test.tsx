import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { FormDefinition } from '@formhaus/core';
import { afterEach, expect, it, vi } from 'vitest';
import { FormActions } from '../src';
import { type CloudNotice, FormhausForm, type FormhausFormActionsProps } from '../src/cloud';

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

it('replaces the notice with noticeComponent, passes the code and focuses a marked element', async () => {
  stub(new TypeError('Failed to fetch'), reply(201, { id: 's1', values: {} }));
  const seen: CloudNotice[] = [];
  render(
    <FormhausForm
      id="abc"
      initialForm={initialForm}
      noticeComponent={({ notice, onAction }) => {
        seen.push(notice);
        return (
          <div data-fh-notice tabIndex={-1}>
            <span>{notice.code}</span>
            <button type="button" onClick={() => onAction('retry')}>
              Again
            </button>
          </div>
        );
      }}
    />,
  );
  send();
  expect(await screen.findByText('network')).toBeDefined();
  expect(document.querySelector('.fh-form__notice')).toBeNull();
  expect(seen[0]).toMatchObject({ tone: 'error', code: 'network', action: 'retry' });
  await waitFor(() => expect(document.activeElement?.hasAttribute('data-fh-notice')).toBe(true));
  fireEvent.click(screen.getByRole('button', { name: 'Again' }));
  expect(await screen.findByRole('status')).toBeDefined();
});

it('focuses the first invalid field when a replaced notice has no marker', async () => {
  stub(reply(422, { errors: { email: 'Taken' } }));
  render(<FormhausForm id="abc" initialForm={initialForm} noticeComponent={() => <p>Custom</p>} />);
  send();
  expect(await screen.findByText('Taken')).toBeDefined();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Email')));
});

it('focuses the first invalid field when a marked notice cannot take focus', async () => {
  stub(reply(422, { errors: { email: 'Taken', ghost: 'Unknown' } }));
  render(<FormhausForm id="abc" initialForm={initialForm} noticeComponent={({ notice }) => <div data-fh-notice>{notice.details}</div>} />);
  send();
  expect(await screen.findByText('Unknown')).toBeDefined();
  await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Email')));
});

it('renders the notice by the actions with noticePlacement actions', async () => {
  stub(reply(429, { error: 'rate_limited' }));
  render(<FormhausForm id="abc" initialForm={initialForm} noticePlacement="actions" />);
  send();
  const text = await screen.findByText('Too many attempts. Wait a minute and try again.');
  const notice = text.closest('.fh-form__notice')!;
  expect(precedes(screen.getByLabelText('Email'), notice)).toBe(true);
  expect(precedes(notice, screen.getByRole('button', { name: 'Send' }))).toBe(true);
  await waitFor(() => expect(document.activeElement).toBe(notice));
});

it('passes the notice and its action to a custom actions component', async () => {
  stub(reply(503, { error: 'unavailable' }), reply(201, { id: 's1', values: {} }));
  function Actions({ notice, onNoticeAction, ...props }: FormhausFormActionsProps) {
    return (
      <>
        {notice && (
          <button type="button" onClick={() => onNoticeAction?.('retry')}>
            {notice.code}
          </button>
        )}
        <FormActions {...props} />
      </>
    );
  }
  render(<FormhausForm id="abc" initialForm={initialForm} actionsComponent={Actions} noticeComponent={() => null} />);
  send();
  fireEvent.click(await screen.findByRole('button', { name: 'unavailable' }));
  expect(await screen.findByRole('status')).toBeDefined();
});

it('translates notice texts and buttons with a cloudLabels catalog', async () => {
  stub(reply(409, { error: 'verification_required' }));
  render(
    <FormhausForm id="abc" initialForm={initialForm} cloudLabels={{ verification_required: 'Bitte neu laden.', reload: 'Neu laden' }} />,
  );
  send();
  expect(await screen.findByText('Bitte neu laden.')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Neu laden' })).toBeDefined();
});

it('translates with a cloudLabels function and keeps English for missing keys', async () => {
  stub(reply(0, null), reply(201, { id: 's1', values: {} }));
  const labels = vi.fn((key: string) => (key === 'retry' ? 'Erneut' : undefined));
  render(<FormhausForm id="abc" initialForm={{ definition, settings: { allowAnother: true } }} cloudLabels={labels} />);
  send();
  expect(await screen.findByText('Could not reach the form server. Check your connection and try again.')).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Erneut' }));
  expect(await screen.findByText('Thank you. Your response was submitted.')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Submit another response' })).toBeDefined();
  expect(labels).toHaveBeenCalledWith('network');
});

it('translates the load error and its retry button', async () => {
  stub(reply(503, { error: 'unavailable' }));
  render(<FormhausForm id="abc" cloudLabels={{ unavailable: 'Nicht erreichbar', retry: 'Erneut' }} />);
  expect(await screen.findByText('Nicht erreichbar')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Erneut' })).toBeDefined();
});

it('translates the default success texts', async () => {
  stub(reply(201, { id: 's1', values: {} }));
  render(
    <FormhausForm
      id="abc"
      initialForm={{ definition, settings: { allowAnother: true } }}
      cloudLabels={{ submitted: 'Danke', submitAnother: 'Noch eine Antwort' }}
    />,
  );
  send();
  expect(await screen.findByText('Danke')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Noch eine Antwort' })).toBeDefined();
});

it('codes a server error without a code as unknown', async () => {
  stub(reply(500, {}));
  const seen: CloudNotice[] = [];
  render(
    <FormhausForm
      id="abc"
      initialForm={initialForm}
      cloudLabels={{ unknown: 'Fehler' }}
      noticeComponent={({ notice }) => {
        seen.push(notice);
        return <p>{notice.message}</p>;
      }}
    />,
  );
  send();
  expect(await screen.findByText('Fehler')).toBeDefined();
  expect(seen.at(-1)).toMatchObject({ code: 'unknown', action: 'retry' });
});

it('reports a cloud failure to onError once and errors of its own hooks too', async () => {
  stub(reply(409, { error: 'paused' }));
  const onError = vi.fn();
  const hook = new Error('hook failed');
  const { rerender } = render(<FormhausForm id="abc" initialForm={initialForm} onError={onError} />);
  send();
  expect(await screen.findByText('This form is paused.')).toBeDefined();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'paused' }));
  rerender(
    <FormhausForm
      id="abc"
      initialForm={initialForm}
      onError={onError}
      onBeforeSubmit={() => {
        throw hook;
      }}
    />,
  );
  send();
  await waitFor(() => expect(onError).toHaveBeenCalledWith(hook));
  expect(onError).toHaveBeenCalledTimes(2);
});

it('renders on the server with a custom notice and actions placement', async () => {
  const { renderToString } = await import('react-dom/server');
  const html = renderToString(
    <FormhausForm id="abc" initialForm={initialForm} noticePlacement="actions" noticeComponent={({ notice }) => <p>{notice.code}</p>} />,
  );
  expect(html).toContain('Email');
  expect(html).toContain('Send');
});
