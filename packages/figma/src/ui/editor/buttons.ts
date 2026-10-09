import type { FormDefinition, FormStep } from '@formhaus/core';
import { element, iconButton } from '../dom';
import { icon } from '../icons';
import { setBackLabel, setBackVisible, setCancel, setNextLabel, setNextVisible, setSkip, type SkippableStep } from './actions';
import { labelled, textInput } from './controls';

export interface ButtonsContext {
  draft: FormDefinition;
  changed(): void;
  rerender(): void;
}

function label(action: FormStep['next']): string {
  return typeof action === 'object' ? action.label : '';
}

function row(title: string, input: HTMLInputElement, remove?: () => void): HTMLElement {
  const control = element('div', 'button-control');
  control.appendChild(input);
  if (remove) control.appendChild(iconButton('close', `Remove ${title.toLowerCase()}`, remove));
  return labelled(title, control, 'detail');
}

export function addLink(text: string, onClick: () => void): HTMLElement {
  const link = element('button', 'link add-link');
  link.type = 'button';
  link.append(icon('add', 14), document.createTextNode(text));
  link.onclick = onClick;
  return link;
}

export function buttonsBlock(step: SkippableStep, index: number, count: number, multiStep: boolean, context: ButtonsContext): HTMLElement {
  const { draft, changed, rerender } = context;
  const block = element('div', 'buttons-block');
  block.appendChild(element('div', 'section-label', 'Buttons'));
  const last = index === count - 1;
  if (last) {
    block.appendChild(row('Submit', textInput(draft.submit.label, 'Submit', 'input', (value) => { draft.submit = { ...draft.submit, label: value }; changed(); }, 'Submit button')));
  } else if (step.next === false) {
    block.appendChild(addLink('Continue button (moves on automatically now)', () => { setNextVisible(step, true); rerender(); }));
  } else {
    block.appendChild(row('Continue', textInput(label(step.next), 'Continue', 'input', (value) => { setNextLabel(step, value); changed(); }, 'Continue button'), () => { setNextVisible(step, false); rerender(); }));
  }
  if (multiStep && index > 0) {
    block.appendChild(step.back === false
      ? addLink('Back button', () => { setBackVisible(step, true); rerender(); })
      : row('Back', textInput(label(step.back), 'Back', 'input', (value) => { setBackLabel(step, value); changed(); }, 'Back button'), () => { setBackVisible(step, false); rerender(); }));
  }
  if (multiStep) {
    block.appendChild(step.skip
      ? row('Skip', textInput(step.skip.label, 'Skip', 'input', (value) => { setSkip(step, value); changed(); }, 'Skip button'), () => { setSkip(step, null); rerender(); })
      : addLink('Skip button', () => { setSkip(step, 'Skip'); rerender(); }));
  }
  if (index === 0) {
    block.appendChild(draft.cancel
      ? row('Cancel', textInput(draft.cancel.label, 'Cancel', 'input', (value) => { setCancel(draft, value); changed(); }, 'Cancel button'), () => { setCancel(draft, null); rerender(); })
      : addLink('Cancel button', () => { setCancel(draft, 'Cancel'); rerender(); }));
  }
  return block;
}
