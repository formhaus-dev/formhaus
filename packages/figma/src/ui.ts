type OutputType = 'error' | 'success';

interface PluginMessage {
  type: string;
  message?: string;
  isCustom?: boolean;
  map?: string;
}

function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Missing UI element: ${id}`);
  return element as T;
}

function postMessage(message: Record<string, unknown>): void {
  parent.postMessage({ pluginMessage: message }, '*');
}

function showOutput(element: HTMLElement, text: string, type: OutputType): void {
  element.textContent = text;
  element.className = `output ${type}`;
}

const definitionInput = getElement<HTMLTextAreaElement>('definition');
const output = getElement<HTMLElement>('output');
const generateButton = getElement<HTMLButtonElement>('generate');
const componentMapInput = getElement<HTMLTextAreaElement>('componentMap');
const mapOutput = getElement<HTMLElement>('mapOutput');
const mapStatus = getElement<HTMLElement>('mapStatus');

for (const tab of document.querySelectorAll<HTMLButtonElement>('.tab')) {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    for (const item of document.querySelectorAll('.tab, .tab-content')) {
      item.classList.remove('active');
    }
    tab.classList.add('active');
    if (target) getElement(`tab-${target}`).classList.add('active');
  });
}

const example = JSON.stringify({
  id: 'basic-form',
  title: 'Contact Information',
  submit: { label: 'Submit' },
  fields: [
    { key: 'firstName', type: 'text', label: 'First Name', validation: { required: true } },
    { key: 'email', type: 'email', label: 'Email Address', validation: { required: true } },
    {
      key: 'country',
      type: 'select',
      label: 'Country',
      options: [
        { value: 'US', label: 'United States' },
        { value: 'MX', label: 'Mexico' },
      ],
    },
    { key: 'terms', type: 'checkbox', label: 'I agree to terms', validation: { required: true } },
  ],
}, null, 2);

getElement('loadExample').onclick = () => { definitionInput.value = example; };
generateButton.onclick = () => {
  const definition = definitionInput.value.trim();
  if (!definition) {
    showOutput(output, 'Paste a form definition first.', 'error');
    return;
  }
  generateButton.disabled = true;
  generateButton.textContent = 'Generating...';
  output.className = 'output';
  output.textContent = '';
  postMessage({ type: 'generate', definition });
};

getElement('loadCurrentMap').onclick = () => postMessage({ type: 'getComponentMap' });
getElement('resetMap').onclick = () => postMessage({ type: 'resetComponentMap' });
getElement('saveMap').onclick = () => {
  const componentMap = componentMapInput.value.trim();
  if (!componentMap) {
    showOutput(mapOutput, 'Paste a component map JSON first.', 'error');
    return;
  }
  try {
    JSON.parse(componentMap);
    postMessage({ type: 'setComponentMap', componentMap });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    showOutput(mapOutput, `Invalid JSON: ${message}`, 'error');
  }
};

window.onmessage = (event: MessageEvent<{ pluginMessage?: PluginMessage }>) => {
  const message = event.data.pluginMessage;
  if (!message) return;
  if (message.type === 'success' || message.type === 'error') {
    generateButton.disabled = false;
    generateButton.textContent = 'Generate';
    showOutput(output, message.message ?? '', message.type);
  }
  if (message.type === 'componentMapStatus') {
    mapStatus.textContent = message.isCustom ? 'Using custom map' : 'Using default map';
    mapStatus.className = `status-badge ${message.isCustom ? 'custom' : 'default'}`;
  }
  if (message.type === 'componentMapData') componentMapInput.value = message.map ?? '';
  if (message.type === 'componentMapSaved') {
    showOutput(mapOutput, message.message ?? '', 'success');
  }
  if (message.type === 'componentMapError') {
    showOutput(mapOutput, message.message ?? '', 'error');
  }
};
