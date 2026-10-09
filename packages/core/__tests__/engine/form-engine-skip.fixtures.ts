import { FormEngine } from '../../src/engine';
import type { FormDefinition, FormEngineOptions } from '../../src';

export function skipDefinition(): FormDefinition {
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
      { id: 'notes', title: 'Notes', skip: { label: 'Skip' }, fields: [{ key: 'notes', type: 'text', label: 'Notes', validation: { required: true } }] },
    ],
  };
}

export function routedSkipDefinition(): FormDefinition {
  return {
    id: 'routed-skip',
    title: 'Routed',
    submit: { label: 'Submit' },
    steps: [
      {
        id: 'kind',
        title: 'Kind',
        skip: { label: 'Skip' },
        fields: [{ key: 'kind', type: 'text', label: 'Kind', defaultValue: 'personal' }],
        routes: [{ to: 'business', show: [{ field: 'kind', eq: 'business' }] }, { to: 'personal' }],
      },
      { id: 'business', title: 'Business', fields: [{ key: 'company', type: 'text', label: 'Company' }], routes: [{ to: null }] },
      { id: 'personal', title: 'Personal', fields: [{ key: 'nickname', type: 'text', label: 'Nickname' }] },
    ],
  };
}

export async function onExtras(options: FormEngineOptions = {}) {
  const engine = new FormEngine(skipDefinition(), { name: 'Ada' }, options);
  await engine.nextStepAsync();
  return engine;
}
