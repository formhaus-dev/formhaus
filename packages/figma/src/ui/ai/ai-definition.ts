import type { FormDefinition, FormField } from '@formhaus/core';

export interface AiValues {
  target?: 'new' | 'edit';
  prompt?: string;
  provider?: string;
  apiKey?: string;
}

const TARGETS = [
  { value: 'edit', label: 'Edit this form' },
  { value: 'new', label: 'New form' },
];

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'openai', label: 'OpenAI' },
];

export function aiDefinition(editable: boolean, editing: boolean): FormDefinition {
  const target: FormField[] = editable ? [{ key: 'target', type: 'radio', label: 'Generate for', options: TARGETS }] : [];
  return {
    id: 'ai-panel',
    title: 'Describe with AI',
    submit: { label: 'Generate' },
    fields: [
      ...target,
      {
        key: 'prompt',
        type: 'textarea',
        label: 'Form description',
        placeholder: editing ? 'Describe the change…' : 'Describe the form…',
        validation: { required: 'Describe the form first.' },
      },
      { key: 'provider', type: 'select', label: 'Provider', options: PROVIDERS },
      {
        key: 'apiKey',
        type: 'password',
        label: 'API key',
        placeholder: 'API key',
        validation: { required: 'Add your API key first.' },
      },
    ],
  };
}
