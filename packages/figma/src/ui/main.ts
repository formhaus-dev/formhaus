import type { FormDefinition } from '@formhaus/core';
import type { Notice } from '../bindings/messages';
import type { BindingRow } from '../bindings/rows';
import type { SelectionPreview } from '../bindings/selection-preview';
import type { Profile } from '../profiles';
import { createComponentsPanel } from './components';
import { byId } from './dom';
import { createFormPanel } from './form-panel';

type OutputType = 'error' | 'success' | 'info';

interface PluginMessage {
  type: string;
  message?: string;
  source?: 'kit' | 'custom';
  kit?: string;
  boundCount?: number;
  rows?: BindingRow[];
  notice?: Notice;
  item?: SelectionPreview | null;
  definition?: FormDefinition | null;
  profiles?: Profile[];
}

function post(message: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

function showOutput(element: HTMLElement, text: string, type?: OutputType): void {
  element.textContent = text;
  element.className = type ? `output ${type}` : 'output';
}

const bindingsOutput = byId('bindingsOutput');
const components = createComponentsPanel(post, (text, tone) => showOutput(bindingsOutput, text, tone));
const form = createFormPanel(post, showOutput, () => selectTab('components'));

function selectTab(target: string): void {
  for (const item of document.querySelectorAll<HTMLElement>('.tab, .panel')) {
    const active = item.dataset.tab === target || item.id === `tab-${target}`;
    item.classList.toggle('active', active);
    if (item.classList.contains('tab')) item.setAttribute('aria-selected', String(active));
  }
  if (target === 'components') post({ type: 'getBindings' });
}

for (const tab of document.querySelectorAll<HTMLButtonElement>('.tab')) tab.onclick = () => selectTab(tab.dataset.tab ?? 'generate');
byId('autoMatch').onclick = () => post({ type: 'autoMatch' });
function applyState(message: PluginMessage): void {
  form.setSource(message);
  components.setKit(message.kit);
}

const HANDLERS: Record<string, (message: PluginMessage) => void> = {
  success: (message) => form.finish(message.message ?? '', 'success'),
  error: (message) => form.finish(message.message ?? '', 'error'),
  state: applyState,
  form: (message) => form.setCanvasForm(message.definition ?? null),
  selection: (message) => components.setSelection(message.item ?? null),
  bindings: (message) => {
    components.setRows(message.rows ?? [], message.profiles ?? [], message.notice?.profileId);
    showOutput(bindingsOutput, message.notice?.text ?? '', message.notice?.tone);
  },
  bindingsError: (message) => showOutput(bindingsOutput, message.message ?? '', 'error'),
  notice: (message) => showOutput(byId('output'), message.message ?? '', 'info'),
};

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginMessage }>) => {
  const message = event.data.pluginMessage;
  if (message) HANDLERS[message.type]?.(message);
};
