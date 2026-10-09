import type { Notice } from '../bindings/messages';
import type { BindingRow } from '../bindings/rows';
import type { SelectionPreview } from '../bindings/selection-preview';
import { ROLES } from '../roles';
import { createComponentsPanel } from './components';
import { byId } from './dom';
import { EXAMPLE } from './example';

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
}

function post(message: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

function showOutput(element: HTMLElement, text: string, type?: OutputType): void {
  element.textContent = text;
  element.className = type ? `output ${type}` : 'output';
}

const definitionInput = byId<HTMLTextAreaElement>('definition');
const output = byId('output');
const generateButton = byId<HTMLButtonElement>('generate');
const componentMapInput = byId<HTMLTextAreaElement>('componentMap');
const mapOutput = byId('mapOutput');
const mapStatus = byId('mapStatus');
const kitSelect = byId<HTMLSelectElement>('kit');
const customHint = byId('customHint');
const bindingsOutput = byId('bindingsOutput');
const sourceInputs = [...document.querySelectorAll<HTMLInputElement>('input[name=source]')];
const components = createComponentsPanel(post);

function selectTab(target: string): void {
  for (const item of document.querySelectorAll<HTMLElement>('.tab, .panel')) {
    const active = item.dataset.tab === target || item.id === `tab-${target}`;
    item.classList.toggle('active', active);
    if (item.classList.contains('tab')) item.setAttribute('aria-selected', String(active));
  }
  if (target === 'components') post({ type: 'getBindings' });
}

function selectedSource(): string {
  return sourceInputs.find((input) => input.checked)?.value ?? 'kit';
}

function sendComponents(): void {
  post({ type: 'setComponents', source: selectedSource(), kit: kitSelect.value });
}

for (const tab of document.querySelectorAll<HTMLButtonElement>('.tab')) tab.onclick = () => selectTab(tab.dataset.tab ?? 'generate');
for (const input of sourceInputs) input.addEventListener('change', sendComponents);
kitSelect.addEventListener('change', () => {
  sourceInputs.forEach((input) => { input.checked = input.value === 'kit'; });
  sendComponents();
});
byId('openComponents').onclick = (event) => {
  event.preventDefault();
  selectTab('components');
};
byId('loadExample').onclick = () => { definitionInput.value = EXAMPLE; };
byId('autoMatch').onclick = () => post({ type: 'autoMatch' });

generateButton.onclick = () => {
  const definition = definitionInput.value.trim();
  if (!definition) return showOutput(output, 'Paste a form definition first.', 'error');
  generateButton.disabled = true;
  generateButton.textContent = 'Generating…';
  showOutput(output, '');
  post({ type: 'generate', definition });
};

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

function customSummary(message: PluginMessage): string {
  if (message.boundCount) return `${message.boundCount} of ${ROLES.length} bound`;
  return message.hasStoredMap ? 'Using the saved JSON map' : 'Bind them in Components';
}

function applyState(message: PluginMessage): void {
  for (const input of sourceInputs) input.checked = input.value === message.source;
  if (message.kit) kitSelect.value = message.kit;
  components.setKit(message.kit);
  customHint.textContent = customSummary(message);
  mapStatus.textContent = message.hasStoredMap ? 'Custom map saved' : 'No custom map';
  mapStatus.className = `badge ${message.hasStoredMap ? 'tone-brand' : 'tone-neutral'}`;
}

const HANDLERS: Record<string, (message: PluginMessage) => void> = {
  success: (message) => finishGenerate(message, 'success'),
  error: (message) => finishGenerate(message, 'error'),
  state: applyState,
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

function finishGenerate(message: PluginMessage, type: OutputType): void {
  generateButton.disabled = false;
  generateButton.textContent = 'Generate form';
  showOutput(output, message.message ?? '', type);
}

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginMessage }>) => {
  const message = event.data.pluginMessage;
  if (message) HANDLERS[message.type]?.(message);
};
