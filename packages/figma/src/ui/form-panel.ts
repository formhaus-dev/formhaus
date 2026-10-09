import type { FormDefinition } from '@formhaus/core';
import type { FormLayout } from '../render-actions';
import { ROLES } from '../roles';
import { byId, selectSegment } from './dom';
import { createEditor } from './editor/editor';
import { emptyForm } from './editor/model';
import { EXAMPLE } from './example';

type Post = (message: Record<string, unknown>) => void;
type Show = (element: HTMLElement, text: string, type?: 'error' | 'success' | 'info') => void;

export interface SourceState {
  source?: string;
  kit?: string;
  boundCount?: number;
}

export function createFormPanel(post: Post, show: Show, openComponents: () => void) {
  const sourceSelect = byId<HTMLSelectElement>('sourceSelect');
  const status = byId('formStatus');
  const jsonInput = byId<HTMLTextAreaElement>('definition');
  const editorRoot = byId('editor');
  const output = byId('output');
  const button = byId<HTMLButtonElement>('generate');
  const modes = [...document.querySelectorAll<HTMLButtonElement>('.mode')];
  const openPending = byId<HTMLButtonElement>('openCanvasForm');
  let mode: 'fields' | 'json' = 'fields';
  let canvasId: string | null = null;
  let dirty = false;
  let pending: { definition: FormDefinition; layout?: FormLayout } | null = null;

  const editor = createEditor(editorRoot, () => {
    dirty = true;
    refresh();
  }, (text) => show(output, text, 'error'));

  function refresh(): void {
    const draft = editor.get();
    const editing = canvasId !== null && draft.id === canvasId;
    status.textContent = pending
      ? `“${pending.definition.title || 'Untitled'}” selected · unsaved edits here`
      : editing ? `Editing “${draft.title || 'Untitled'}” from the canvas` : 'New form';
    status.classList.toggle('is-editing', editing && !pending);
    openPending.hidden = !pending;
    button.textContent = editing ? 'Update form' : 'Generate form';
  }

  function load(definition: FormDefinition, layout?: FormLayout, edited = false): void {
    editor.set(definition, layout);
    jsonInput.value = JSON.stringify(definition, null, 2);
    dirty = edited;
    pending = null;
    show(output, '');
    refresh();
  }

  function syncFromJson(): boolean {
    if (mode !== 'json') return true;
    try {
      editor.set(JSON.parse(jsonInput.value) as FormDefinition, editor.layout());
      return true;
    } catch (error) {
      show(output, `Fix the JSON first: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }

  function setMode(next: 'fields' | 'json'): void {
    if (next === mode) return;
    if (next === 'json') jsonInput.value = JSON.stringify(editor.get(), null, 2);
    else if (!syncFromJson()) return;
    mode = next;
    show(output, '');
    selectSegment(modes, 'mode', mode);
    editorRoot.hidden = mode !== 'fields';
    jsonInput.hidden = mode !== 'json';
    refresh();
  }

  jsonInput.addEventListener('input', () => {
    dirty = true;
  });
  openPending.onclick = () => {
    if (!pending) return;
    canvasId = pending.definition.id;
    load(pending.definition, pending.layout);
  };
  for (const item of modes) item.onclick = () => setMode(item.dataset.mode as 'fields' | 'json');
  sourceSelect.onchange = () => {
    const [source, kit] = sourceSelect.value.split(':');
    post({ type: 'setComponents', source, kit });
  };
  byId('openComponents').onclick = openComponents;
  byId('newForm').onclick = () => load(emptyForm());
  byId('loadExample').onclick = () => load(JSON.parse(EXAMPLE) as FormDefinition);
  button.onclick = () => {
    if (button.disabled || !syncFromJson()) return;
    const definition = JSON.stringify(editor.get());
    button.disabled = true;
    button.textContent = 'Working…';
    show(output, '');
    post({ type: 'generate', definition, layout: editor.layout() });
  };

  load(emptyForm());

  return {
    draft: () => (syncFromJson() ? editor.get() : null),
    apply(definition: FormDefinition, note: string) {
      load(definition, editor.layout(), true);
      show(output, note, 'info');
    },
    setCanvasForm(definition: FormDefinition | null, layout?: FormLayout) {
      if (!definition || definition.id === editor.get().id) {
        if (definition) canvasId = definition.id;
        pending = null;
        return refresh();
      }
      if (dirty) {
        pending = { definition, layout };
        return refresh();
      }
      canvasId = definition.id;
      load(definition, layout);
    },
    setSource(state: SourceState) {
      const custom = sourceSelect.querySelector<HTMLOptionElement>('option[value=custom]');
      if (custom) custom.textContent = state.boundCount ? `My components · ${state.boundCount} of ${ROLES.length} bound` : 'My components';
      sourceSelect.value = state.source === 'custom' ? 'custom' : `kit:${state.kit ?? 'material'}`;
    },
    finish(text: string, type: 'error' | 'success') {
      button.disabled = false;
      if (type === 'success') {
        dirty = false;
        canvasId = editor.get().id;
      }
      refresh();
      show(output, text, type);
    },
  };
}
