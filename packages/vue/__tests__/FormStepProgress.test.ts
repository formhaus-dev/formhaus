import { render, screen, within } from '@testing-library/vue';
import { describe, expect, it } from 'vitest';
import FormStepProgress from '../src/FormStepProgress.vue';

const steps = [
  { id: 'account', title: 'Account', errorCount: 1 },
  { id: 'untitled', title: '', errorCount: 2 },
  { id: 'review', title: 'Review', errorCount: 0 },
];

describe('FormStepProgress', () => {
  it('lists the steps in order and marks only the current one', () => {
    render(FormStepProgress, { props: { current: 2, total: 3, steps } });
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(items.map((item) => item.querySelector('.fh-step-progress__name')?.textContent)).toEqual(['Account', 'Step 2', 'Review']);
    expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([null, 'step', null]);
  });

  it('shows the error count with an accessible label', () => {
    render(FormStepProgress, { props: { current: 2, total: 3, steps } });
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.classList.contains('fh-step-progress__step--invalid'))).toEqual([true, true, false]);
    const errors = items[1].querySelector('.fh-step-progress__errors')!;
    expect(errors.querySelector('[aria-hidden="true"]')?.textContent).toBe('2');
    expect(errors.querySelector('.fh-step-progress__errors-label')?.textContent).toBe('Errors: 2');
    expect(items[2].querySelector('.fh-step-progress__errors')).toBeNull();
  });

  it('keeps the counter label override', () => {
    render(FormStepProgress, { props: { current: 1, total: 3, steps, counterLabel: 'Almost there' } });
    expect(document.querySelector('.fh-step-progress__counter')?.textContent).toBe('Almost there');
  });

  it('renders the same markup as React', () => {
    render(FormStepProgress, { props: { current: 2, total: 3, steps } });
    expect(document.querySelector('.fh-step-progress__steps')?.innerHTML.replace(/<!--.*?-->/g, '')).toBe(
      '<li class="fh-step-progress__step fh-step-progress__step--invalid"><span class="fh-step-progress__name">Account</span><span class="fh-step-progress__errors"><span aria-hidden="true">1</span><span class="fh-step-progress__errors-label">Errors: 1</span></span></li><li class="fh-step-progress__step fh-step-progress__step--invalid" aria-current="step"><span class="fh-step-progress__name">Step 2</span><span class="fh-step-progress__errors"><span aria-hidden="true">2</span><span class="fh-step-progress__errors-label">Errors: 2</span></span></li><li class="fh-step-progress__step"><span class="fh-step-progress__name">Review</span></li>',
    );
  });
});
