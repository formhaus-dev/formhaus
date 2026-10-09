import type { FormDefinition, FormStep } from '@formhaus/core';
import { describe, expect, it } from 'vitest';
import { stepButtons } from '../render-actions';
import { setBackLabel, setBackVisible, setCancel, setNextLabel, setNextVisible } from '../ui/editor/actions';

const definition = (): FormDefinition => ({ id: 'f', title: 'Quiz', submit: { label: 'Finish' }, steps: [] });
const step = (extra: Partial<FormStep> = {}): FormStep => ({ id: 's', title: 'S', fields: [], ...extra });

describe('step buttons in Figma', () => {
  const at = (isFirst: boolean, isLast: boolean) => ({ isFirst, isLast, isMultiStep: true });

  it('maps next and submit to primary, back to secondary, skip and cancel to text', () => {
    const form = { ...definition(), cancel: { label: 'Close' } };
    expect(stepButtons(form, { next: { label: 'Next question' }, skip: { label: 'Not now' } }, at(true, false))).toEqual([
      { label: 'Next question', kind: 'primary', action: 'next' },
      { label: 'Not now', kind: 'text', action: 'skip' },
      { label: 'Close', kind: 'text', action: 'cancel' },
    ]);
    expect(stepButtons(definition(), { back: { label: 'Previous' } }, at(false, true))).toEqual([
      { label: 'Finish', kind: 'primary', action: 'submit' },
      { label: 'Previous', kind: 'secondary', action: 'back' },
    ]);
  });

  it('hides false actions and honours an explicit variant', () => {
    expect(stepButtons(definition(), { next: false, back: false }, at(false, false))).toEqual([]);
    expect(stepButtons(definition(), { back: { label: 'Back', variant: 'text' } }, at(false, false))[1]).toEqual({ label: 'Back', kind: 'text', action: 'back' });
  });

  it('ignores skip on a single-step form', () => {
    expect(stepButtons(definition(), { skip: { label: 'Skip' } }, { isFirst: true, isLast: true, isMultiStep: false })).toEqual([{ label: 'Finish', kind: 'primary', action: 'submit' }]);
  });
});

describe('editing step buttons', () => {
  it('keeps other action settings and falls back to defaults when cleared', () => {
    const current = step({ next: { label: 'Go', variant: 'secondary' } });
    setNextLabel(current, 'Next');
    expect(current.next).toEqual({ label: 'Next', variant: 'secondary' });
    setNextLabel(current, '');
    expect(current.next).toEqual({ label: 'Continue', variant: 'secondary' });
    const plain = step();
    setBackLabel(plain, 'Previous');
    setBackLabel(plain, '');
    expect(plain.back).toBeUndefined();
  });

  it('hides and restores back and continue', () => {
    const current = step({ back: { label: 'Previous' } });
    setBackVisible(current, false);
    expect(current.back).toBe(false);
    setBackVisible(current, true);
    expect(current.back).toBeUndefined();
    setNextVisible(current, false);
    expect(current.next).toBe(false);
  });

  it('adds, renames and removes the cancel button', () => {
    const form = definition();
    setCancel(form, 'Cancel');
    setCancel(form, 'Close');
    expect(form.cancel).toEqual({ label: 'Close' });
    setCancel(form, '');
    expect(form.cancel).toEqual({ label: 'Cancel' });
    setCancel(form, null);
    expect(form.cancel).toBeUndefined();
  });
});
