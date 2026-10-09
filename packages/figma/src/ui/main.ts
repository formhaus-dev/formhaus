import type { FormDefinition } from '@formhaus/core';
import type { Notice } from '../bindings/messages';
import type { BindingRow } from '../bindings/rows';
import type { SelectionPreview } from '../bindings/selection-preview';
import { createComponentsPanel } from './components';
import { byId } from './dom';
import { createFormPanel } from './form-panel';

type OutputType = 'error' | 'success' | 'info';

interface PluginMessage {
  type: string;
  message?: string;
  map?: string;
  source?: 'kit' | 'custom';
  kit?: string;
  hasStoredMap?: boolean;
  boundCount?: number;
  rows?: BindingRow[];
  notice?: Notice;
  item?: SelectionPreview | null;
  definition?: FormDefinition | null;
}

function post(message: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

function showOutput(element: HTMLElement, text: string, type?: OutputType): void {
  element.textContent = text;
  element.className = type ? `output ${type}` : 'output';
}

const componentMapInput = byId<HTMLTextAreaElement>('componentMap');
const mapOutput = byId('mapOutput');
const mapStatus = byId('mapStatus');
const bindingsOutput = byId('bindingsOutput');
const components = createComponentsPanel(post);
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
byId('loadCurrentMap').onclick = () => post({ type: 'getComponentMap' });
byId('resetMap').onclick = () => post({ type: 'resetComponentMap' });
byId('saveMap').onclick = () => {
  const componentMap = componentMapInput.value.trim();
  if (!componentMap) return showOutput(mapOutput, 'Paste a component map JSON first.', 'error');
  try {
    JSON.parse(componentMap);
    post({ type: 'setComponentMap', componentMap });
  } catch (error) {
    showOutput(mapOutput, `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`, 'error');
  }
};

function applyState(message: PluginMessage): void {
  form.setSource(message);
  components.setKit(message.kit);
  mapStatus.textContent = message.hasStoredMap ? 'Custom map saved' : 'No custom map';
  mapStatus.className = `badge ${message.hasStoredMap ? 'tone-brand' : 'tone-neutral'}`;
}

const HANDLERS: Record<string, (message: PluginMessage) => void> = {
  success: (message) => form.finish(message.message ?? '', 'success'),
  error: (message) => form.finish(message.message ?? '', 'error'),
  state: applyState,
  form: (message) => form.setCanvasForm(message.definition ?? null),
  selection: (message) => components.setSelection(message.item ?? null),
  bindings: (message) => {
    components.setRows(message.rows ?? []);
    showOutput(bindingsOutput, message.notice?.text ?? '', message.notice?.tone);
  },
  bindingsError: (message) => showOutput(bindingsOutput, message.message ?? '', 'error'),
  componentMapData: (message) => { componentMapInput.value = message.map ?? ''; },
  componentMapSaved: (message) => showOutput(mapOutput, message.message ?? '', 'success'),
  componentMapError: (message) => showOutput(mapOutput, message.message ?? '', 'error'),
};

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginMessage }>) => {
  const message = event.data.pluginMessage;
  if (message) HANDLERS[message.type]?.(message);
};
