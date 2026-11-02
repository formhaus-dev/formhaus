import type { FormDefinition, SubmitResult } from '@formhaus/core';
import { HeadlessFormRenderer, type FormRendererHandle } from '@formhaus/vue';
import { computed, createApp, h, nextTick, ref, shallowRef } from 'vue';
import type { AiSettings } from '../../ai-keys';
import { countFields } from '../../parse';
import { byId } from '../dom';
import { icon } from '../icons';
import { aiComponents } from './ai-controls';
import { aiDefinition, type AiValues } from './ai-definition';
import { createAiLayout } from './ai-layout';
import { generateDefinition, messageOf } from './generate';
import type { ProviderId } from './providers';

type Post = (message: Record<string, unknown>) => void;

export interface AiHost {
  draft(): FormDefinition | null;
  apply(definition: FormDefinition, note: string): void;
}

const NO_KEY = 'Bring your own key. It stays in Figma on this machine and requests go straight to the provider.';
const SAVED_KEY = 'Key saved in Figma on this machine.';
const CANCELLED = 'Cancelled.';

export function createAiPanel(post: Post, host: AiHost) {
  const panel = byId('aiPanel');
  const form = ref<FormRendererHandle>();
  const values = shallowRef<AiValues>({});
  const keys = shallowRef<AiSettings['keys']>({});
  const editable = ref(false);
  const running = shallowRef<AbortController | null>(null);
  const cancelled = ref(false);

  const target = computed(() => values.value.target);
  const editing = computed(() => editable.value && target.value === 'edit');
  const definition = computed(() => aiDefinition(editable.value, editing.value));
  const provider = computed(() => (values.value.provider ?? 'anthropic') as ProviderId);
  const saved = computed(() => Boolean(keys.value[provider.value]));

  const layout = createAiLayout({
    hint: computed(() => (saved.value ? SAVED_KEY : NO_KEY)),
    saved,
    running: computed(() => Boolean(running.value)),
    cancelled,
    forget: () => post({ type: 'forgetAiKey', provider: provider.value }),
    close,
    cancel: () => running.value?.abort(),
  });

  function showKey(): void {
    form.value?.setValue('apiKey', keys.value[provider.value] ?? '');
  }

  async function generate(input: AiValues): Promise<SubmitResult> {
    const key = (input.apiKey ?? '').trim();
    const selected = (input.provider ?? 'anthropic') as ProviderId;
    if (key !== keys.value[selected]) post({ type: 'saveAiKey', provider: selected, key });
    const current = editing.value ? (host.draft() ?? undefined) : undefined;
    const controller = new AbortController();
    running.value = controller;
    cancelled.value = false;
    try {
      const { definition: result, warnings } = await generateDefinition({
        provider: selected,
        key,
        description: (input.prompt ?? '').trim(),
        current,
        signal: controller.signal,
      });
      panel.hidden = true;
      host.apply(result, ['Review the form, then generate it.', ...warnings].join(' '));
      return { ok: true };
    } catch (error) {
      cancelled.value = controller.signal.aborted;
      return { ok: false, formErrors: [controller.signal.aborted ? CANCELLED : messageOf(error)] };
    } finally {
      running.value = null;
    }
  }

  async function open(): Promise<void> {
    const draft = host.draft();
    editable.value = Boolean(draft && countFields(draft) > 0);
    panel.hidden = false;
    await nextTick();
    form.value?.engine.setErrors({});
    if (editable.value) form.value?.setValue('target', 'edit');
    panel.querySelector('textarea')?.focus();
  }

  function close(): void {
    running.value?.abort();
    panel.hidden = true;
  }

  createApp({
    render: () =>
      h(HeadlessFormRenderer, {
        ref: form,
        definition: definition.value,
        components: aiComponents,
        layout,
        keepValues: true,
        errorSummary: false,
        onSubmit: (input: Record<string, unknown>) => generate(input as AiValues),
        onValuesChange: (next: Readonly<Record<string, unknown>>) => (values.value = next as AiValues),
        onFieldChange: (key: string) => key === 'provider' && showKey(),
      }),
  }).mount(panel);

  byId('aiOpen').prepend(icon('wand'));
  byId('aiOpen').onclick = () => (panel.hidden ? void open() : close());
  panel.onkeydown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      byId('aiOpen').focus();
    } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && event.target instanceof HTMLTextAreaElement) {
      void form.value?.submit();
    }
  };
  post({ type: 'getAiSettings' });

  return {
    setSettings(settings: AiSettings) {
      keys.value = settings.keys;
      if (!running.value) form.value?.setValue('provider', settings.provider);
      showKey();
    },
  };
}
