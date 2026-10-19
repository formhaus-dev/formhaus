import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FormStepProgress } from '../src/FormStepProgress';

const steps = [
  { id: 'account', title: 'Account', errorCount: 1 },
  { id: 'untitled', title: '', errorCount: 2 },
  { id: 'review', title: 'Review', errorCount: 0 },
];

describe('FormStepProgress', () => {
  it('lists the steps in order and marks only the current one', () => {
    render(<FormStepProgress current={2} total={3} steps={steps} />);
    const items = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(screen.getByRole('list').tagName).toBe('OL');
    expect(items.map((item) => item.querySelector('.fh-step-progress__name')?.textContent)).toEqual(['Account', 'Step 2', 'Review']);
    expect(items.map((item) => item.getAttribute('aria-current'))).toEqual([null, 'step', null]);
  });

  it('shows the error count with an accessible label', () => {
    render(<FormStepProgress current={2} total={3} steps={steps} />);
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.classList.contains('fh-step-progress__step--invalid'))).toEqual([true, true, false]);
    const errors = items[1].querySelector('.fh-step-progress__errors')!;
    expect(errors.querySelector('[aria-hidden="true"]')?.textContent).toBe('2');
    expect(errors.querySelector('.fh-step-progress__errors-label')?.textContent).toBe('Errors: 2');
    expect(items[2].querySelector('.fh-step-progress__errors')).toBeNull();
  });

  it('renders the same markup as Vue', () => {
    render(<FormStepProgress current={2} total={3} steps={steps} />);
    expect(document.querySelector('.fh-step-progress__steps')?.innerHTML).toBe(
      '<li class="fh-step-progress__step fh-step-progress__step--invalid"><span class="fh-step-progress__name">Account</span><span class="fh-step-progress__errors"><span aria-hidden="true">1</span><span class="fh-step-progress__errors-label">Errors: 1</span></span></li><li class="fh-step-progress__step fh-step-progress__step--invalid" aria-current="step"><span class="fh-step-progress__name">Step 2</span><span class="fh-step-progress__errors"><span aria-hidden="true">2</span><span class="fh-step-progress__errors-label">Errors: 2</span></span></li><li class="fh-step-progress__step"><span class="fh-step-progress__name">Review</span></li>',
    );
  });

  it('keeps the bar element with and without the step list', () => {
    const { rerender } = render(<FormStepProgress current={2} total={3} steps={steps} />);
    expect(
      document.querySelector('.fh-step-progress > .fh-step-progress__bar + .fh-step-progress__info + .fh-step-progress__steps'),
    ).not.toBeNull();
    rerender(<FormStepProgress current={2} total={3} />);
    expect(document.querySelector('.fh-step-progress__bar')).not.toBeNull();
    expect(document.querySelector('.fh-step-progress__steps')).toBeNull();
  });

  it('keeps the counter label override', () => {
    render(<FormStepProgress current={1} total={3} steps={steps} counterLabel="Almost there" />);
    expect(document.querySelector('.fh-step-progress__counter')?.textContent).toBe('Almost there');
  });
});
