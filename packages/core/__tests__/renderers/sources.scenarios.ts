import type { FormDefinition } from '../../src';
import type { RendererHarness, TestKit } from './fixtures';

const tracking: FormDefinition = {
  id: 'tracking',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'utm_source', type: 'hidden', label: 'Source', source: { query: 'utm_source' } },
    { key: 'utm_medium', type: 'hidden', label: 'Medium', source: { query: 'utm_medium' }, defaultValue: 'organic' },
    { key: 'utm_campaign', type: 'hidden', label: 'Campaign', source: { query: 'utm_campaign' } },
    { key: 'referrer', type: 'hidden', label: 'Referrer', source: 'referrer' },
    { key: 'page', type: 'hidden', label: 'Page', source: 'page' },
    { key: 'name', type: 'text', label: 'Name' },
  ],
};

const meta: FormDefinition = {
  id: 'meta',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'language', type: 'hidden', label: 'Language', source: 'language', defaultValue: 'unknown' },
    { key: 'title', type: 'hidden', label: 'Title', source: 'pageTitle' },
    { key: 'country', type: 'hidden', label: 'Country', source: 'country' },
  ],
};

const revealed: FormDefinition = {
  id: 'revealed',
  title: '',
  submit: { label: 'Send' },
  fields: [
    { key: 'name', type: 'text', label: 'Name' },
    {
      key: 'utm_source',
      type: 'hidden',
      label: 'Source',
      source: { query: 'utm_source' },
      defaultValue: 'direct',
      show: [{ field: 'name', notEmpty: true }],
    },
  ],
};

interface Page {
  path?: string;
  referrer?: string;
  title?: string;
  language?: () => string;
}

function visit({ path = '/', referrer = '', title = '', language }: Page): () => void {
  const previous = window.location.pathname + window.location.search;
  const restoreTitle = document.title;
  window.history.replaceState(null, '', path);
  Object.defineProperty(document, 'referrer', { configurable: true, get: () => referrer });
  document.title = title;
  if (language) Object.defineProperty(navigator, 'language', { configurable: true, get: language });
  return () => {
    window.history.replaceState(null, '', previous);
    delete (document as { referrer?: string }).referrer;
    if (language) delete (navigator as { language?: string }).language;
    document.title = restoreTitle;
  };
}

export function sourceScenarios(harness: RendererHarness, { it, expect, waitFor, screen, fn }: TestKit): void {
  const send = () => harness.click(screen.getByRole('button', { name: 'Send' }));

  async function submitted(page: Page, run: (onSubmit: ReturnType<typeof fn>) => Promise<void> | void): Promise<void> {
    const leave = visit(page);
    try {
      const onSubmit = fn();
      await run(onSubmit);
    } finally {
      leave();
    }
  }

  it('fills hidden fields from URL parameters, the referrer and the page and falls back to defaultValue', () =>
    submitted({ path: '/landing?utm_source=news&utm_medium=%20%20#top', referrer: 'https://example.com/post' }, async (onSubmit) => {
      harness.mount({ definition: tracking, onSubmit });
      await send();
      await waitFor(() =>
        expect(onSubmit).toHaveBeenCalledWith(
          {
            utm_source: 'news',
            utm_medium: 'organic',
            referrer: 'https://example.com/post',
            page: `${window.location.origin}/landing`,
          },
          [],
        ),
      );
    }));

  it('omits sources that yield nothing when there is no default', () =>
    submitted({ path: '/' }, async (onSubmit) => {
      harness.mount({ definition: tracking, onSubmit });
      await send();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ utm_medium: 'organic', page: `${window.location.origin}/` }, []));
    }));

  it('keeps explicit initial values over sources', () =>
    submitted({ path: '/?utm_source=news' }, async (onSubmit) => {
      harness.mount({ definition: tracking, initialValues: { utm_source: 'partner' }, onSubmit });
      await send();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ utm_source: 'partner' }), []));
    }));

  it('does not report sourced values as field changes', () =>
    submitted({ path: '/?utm_source=news' }, async (onSubmit) => {
      const onFieldChange = fn();
      harness.mount({ definition: tracking, onSubmit, onFieldChange });
      await waitFor(() => expect((document.querySelector('input[name="utm_source"]') as HTMLInputElement).value).toBe('news'));
      expect(onFieldChange).not.toHaveBeenCalled();
    }));

  it('keeps the form working when a browser API throws', () =>
    submitted(
      {
        title: 'Pricing',
        language: () => {
          throw new Error('blocked');
        },
      },
      async (onSubmit) => {
        harness.mount({ definition: meta, onSubmit });
        await send();
        await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ language: 'unknown', title: 'Pricing' }, []));
      },
    ));

  it('restores the sourced value when a conditional hidden field is shown', () =>
    submitted({ path: '/?utm_source=news' }, async (onSubmit) => {
      harness.mount({ definition: revealed, onSubmit });
      await harness.type(screen.getByRole('textbox', { name: 'Name' }), 'Ada');
      await send();
      await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Ada', utm_source: 'news' }, []));
    }));
}
