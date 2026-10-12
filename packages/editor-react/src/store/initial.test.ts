import { isQuestion, setLabel, toDefinition } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import type { SavedDraft } from '../host';
import { initialEditor } from './initial';

const live: FormDefinition = {
  id: 'contact',
  title: 'Contact',
  submit: { label: 'Send' },
  fields: [{ key: 'email', type: 'email', label: 'Email' }],
};
const edited: FormDefinition = { ...live, fields: [...(live.fields ?? []), { key: 'question', type: 'text', label: '' }] };
const draft = (base: number): SavedDraft => ({
  definition: edited,
  baseVersion: base,
  revision: 4,
  savedAt: '',
  savedBy: '',
});

describe('initialEditor', () => {
  it('starts a blank form with one empty field', () => {
    const { form, revision } = initialEditor(null, null);
    expect(form.title).toBe('Untitled form');
    expect(form.blocks).toHaveLength(1);
    expect(revision).toBe(0);
  });

  it('locks keys from the published version and lets new fields follow their label', () => {
    const { form, revision, stale } = initialEditor({ definition: live, version: 3 }, draft(3));
    expect(revision).toBe(4);
    expect(stale).toBe(false);
    const [published, added] = form.blocks.filter(isQuestion);
    if (!published || !added) throw new Error('missing fields');
    setLabel(form, published.uid, 'Work email');
    setLabel(form, added.uid, 'Company');
    expect(toDefinition(form).fields?.map((field) => field.key)).toEqual(['email', 'company']);
  });

  it('flags a draft based on an older version', () => {
    expect(initialEditor({ definition: live, version: 4 }, draft(3)).stale).toBe(true);
  });
});
