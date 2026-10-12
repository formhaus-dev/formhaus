import './styles/tokens.css';
import './styles/base.css';
import { lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { EditorRoot, type EditorRootProps } from './EditorRoot';
import type { EditorHost } from './host';
import { createLocalHost as localHost, type LocalHostOptions } from './hosts/localHost';
import { createMemoryHost as memoryHost, type MemoryHostOptions } from './hosts/memoryHost';

export { readLocalDraft, LOCAL_KEY, carryToBuild } from './hosts/localHost';
export { confirmLeave, hasUnsavedChanges } from './store/leave';
export type { EditorHost, Notice } from './host';
export type { EditorMode } from './shell/EditorView';

const Preview = lazy(() => import('./preview/ReactPreview'));

type WithPreview<T> = Omit<T, 'Preview'> & Partial<Pick<LocalHostOptions, 'Preview'>>;

export const createLocalHost = (options: WithPreview<LocalHostOptions> = {}): EditorHost => localHost({ Preview, ...options });

export const createMemoryHost = (options: WithPreview<MemoryHostOptions> = {}): EditorHost => memoryHost({ Preview, ...options });

export function mount(element: HTMLElement, props: EditorRootProps): () => void {
  const root = createRoot(element);
  root.render(<EditorRoot {...props} />);
  return () => {
    root.unmount();
  };
}
