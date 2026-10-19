import { FormEngine } from '../../src/engine';
import type { FormDefinition, FormEngineOptions } from '../../src';

function skipDefinition(): FormDefinition {
  return {
    id: 'skip',
    title: 'Skip',
    submit: { label: 'Submit' },
    steps: [
      { id: 'name', title: 'Name', fields: [{ key: 'name', type: 'text', label: 'Name', validation: { required: true } }] },
      {
        id: 'extras',
        title: 'Extras',
        skip: { label: 'Not now' },
        fields: [
          { key: 'phone', type: 'text', label: 'Phone', validation: { required: true } },
          { key: 'plan', type: 'text', label: 'Plan', defaultValue: 'free' },
          { key: 'promo', type: 'text', label: 'Promo', show: [{ field: 'plan', eq: 'pro' }] },
        ],
      },
      {
        id: 'notes',
        title: 'Notes',
        skip: { label: 'Skip' },
        fields: [{ key: 'notes', type: 'text', label: 'Notes', validation: { required: true } }],
      },
    ],
  };
}

export async function onExtras(options: FormEngineOptions = {}) {
  const engine = new FormEngine(skipDefinition(), { name: 'Ada' }, options);
  await engine.next();
  return engine;
}
