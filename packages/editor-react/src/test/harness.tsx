import '../styles/tokens.css';
import '../styles/base.css';
import type { BuilderForm } from '@formhaus/builder';
import { render, screen } from '@testing-library/react';
import { createContext, useContext, useState, type ReactNode } from 'react';
import type { EditorHost, Notice, Published } from '../host';
import { Notices, useNotices } from '../root/Notices';
import { EditorView } from '../shell/EditorView';
import type { EditorHandle } from '../store/context';
import { blankForm } from '../store/initial';
import { createEditorStore, type EditorStore } from '../store/store';
import { TooltipProvider } from '../ui';
import { testHost } from './host';

interface Options {
  readOnly?: boolean;
  published?: Published;
  host?: Partial<EditorHost>;
  split?: boolean;
}

const NotifyContext = createContext<(notice: Notice) => void>(() => undefined);

export function TestRoot({ children }: { children: ReactNode }) {
  const { entries, notify, dismiss } = useNotices();
  return (
    <div className="fh-editor">
      <TooltipProvider>
        <NotifyContext value={notify}>{children}</NotifyContext>
        <Notices entries={entries} dismiss={dismiss} />
      </TooltipProvider>
    </div>
  );
}

function View({ store, options }: { store: EditorStore; options: Options }) {
  const notify = useContext(NotifyContext);
  const [handle] = useState<EditorHandle>(() => ({
    store,
    autosave: null,
    host: testHost({ notify, readOnly: !!options.readOnly, ...options.host }),
    published: options.published ?? null,
  }));
  return <EditorView handle={handle} stale={false} split={!!options.split} />;
}

export function renderEditor(form: BuilderForm = blankForm(), options: Options = {}) {
  const store = createEditorStore(form, options);
  const view = render(
    <TestRoot>
      <View store={store} options={options} />
    </TestRoot>,
  );
  return { ...view, store };
}

export const labels = () =>
  [...document.querySelectorAll<HTMLElement>('[data-card]')].map((card) => card.querySelector('textarea')?.value ?? '');

export function fieldLabel(index: number): HTMLElement {
  const node = screen.getAllByRole('textbox', { name: 'Field label' })[index];
  if (!node) throw new Error(`No field label at ${String(index)}`);
  return node;
}

export function topBar(): HTMLElement {
  const node = document.querySelector<HTMLElement>('[data-topbar]');
  if (!node) throw new Error('No editor top bar');
  return node;
}
