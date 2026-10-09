import type { FormDefinition } from '@formhaus/core';
import type { AiSettings } from '../../ai-keys';
import { countFields } from '../../parse';
import { byId, iconButton, selectSegment } from '../dom';
import { icon } from '../icons';
import { generateDefinition, messageOf } from './generate';
import type { ProviderId } from './providers';

type Post = (message: Record<string, unknown>) => void;

export interface AiHost {
  draft(): FormDefinition | null;
  apply(definition: FormDefinition, note: string): void;
}

const NO_KEY = 'Bring your own key. It stays in Figma on this machine and requests go straight to the provider.';

export function createAiPanel(post: Post, host: AiHost) {
  const panel = byId('aiPanel');
  const prompt = byId<HTMLTextAreaElement>('aiPrompt');
  const providerSelect = byId<HTMLSelectElement>('aiProvider');
  const keyInput = byId<HTMLInputElement>('aiKey');
  const hint = byId('aiHint');
  const forget = byId<HTMLButtonElement>('aiForget');
  const output = byId('aiOutput');
  const generate = byId<HTMLButtonElement>('aiGenerate');
  const cancel = byId<HTMLButtonElement>('aiCancel');
  const targets = [...panel.querySelectorAll<HTMLButtonElement>('[data-target]')];
  let keys: AiSettings['keys'] = {};
  let target: 'new' | 'edit' = 'new';
  let running: AbortController | null = null;

  const provider = () => providerSelect.value as ProviderId;
  const say = (text: string, tone?: 'error' | 'info') => {
    output.textContent = text;
    output.className = tone ? `output ${tone}` : 'output';
  };

  function showKey(): void {
    keyInput.value = keys[provider()] ?? '';
    const saved = Boolean(keys[provider()]);
    hint.textContent = saved ? 'Key saved in Figma on this machine.' : NO_KEY;
    forget.hidden = !saved;
  }

  function setTarget(next: 'new' | 'edit'): void {
    target = next;
    selectSegment(targets, 'target', next);
    prompt.placeholder = next === 'edit' ? 'Describe the change…' : 'Describe the form…';
  }

  function setRunning(controller: AbortController | null): void {
    running = controller;
    generate.disabled = Boolean(controller);
    generate.textContent = controller ? 'Generating…' : 'Generate';
    cancel.hidden = !controller;
    for (const control of [prompt, providerSelect, keyInput, forget, ...targets]) control.disabled = Boolean(controller);
  }

  function open(): void {
    const draft = host.draft();
    const editable = Boolean(draft && countFields(draft) > 0);
    byId('aiTargets').hidden = !editable;
    setTarget(editable ? 'edit' : 'new');
    panel.hidden = false;
    say('');
    prompt.focus();
  }

  function close(): void {
    running?.abort();
    panel.hidden = true;
  }

  async function run(): Promise<void> {
    const description = prompt.value.trim();
    const key = keyInput.value.trim();
    if (!description) return say('Describe the form first.', 'error');
    if (!key) {
      keyInput.focus();
      return say('Add your API key first.', 'error');
    }
    if (key !== keys[provider()]) post({ type: 'saveAiKey', provider: provider(), key });
    const current = target === 'edit' ? host.draft() ?? undefined : undefined;
    const controller = new AbortController();
    setRunning(controller);
    say('');
    try {
      const { definition, warnings } = await generateDefinition({ provider: provider(), key, description, current, signal: controller.signal });
      panel.hidden = true;
      host.apply(definition, ['Review the form, then generate it.', ...warnings].join(' '));
    } catch (error) {
      if (controller.signal.aborted) say('Cancelled.', 'info');
      else say(messageOf(error), 'error');
    } finally {
      setRunning(null);
    }
  }

  byId('aiOpen').prepend(icon('wand'));
  byId('aiOpen').onclick = () => (panel.hidden ? open() : close());
  byId('aiHead').appendChild(iconButton('close', 'Close', close));
  for (const item of targets) item.onclick = () => setTarget(item.dataset.target as 'new' | 'edit');
  providerSelect.onchange = showKey;
  forget.onclick = () => post({ type: 'forgetAiKey', provider: provider() });
  generate.onclick = () => void run();
  cancel.onclick = () => running?.abort();
  panel.onkeydown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      byId('aiOpen').focus();
    }
  };
  prompt.onkeydown = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) void run();
  };
  post({ type: 'getAiSettings' });

  return {
    setSettings(settings: AiSettings) {
      keys = settings.keys;
      if (!running) providerSelect.value = settings.provider;
      showKey();
    },
  };
}
