import '@formhaus/core/style.css';
import type { FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

const definition: FormDefinition = {
  id: 'f',
  title: 'F',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      title: 'One',
      description: 'First line\nSecond line',
      fields: [
        { key: 'name', type: 'text', label: 'Name', helperText: 'First line\nSecond line' },
        { key: 'extras', type: 'section', title: 'Extras', description: 'First line\nSecond line', fields: [] },
      ],
    },
    { id: 'two', title: 'Two', fields: [] },
  ],
};

describe('line breaks in texts', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows each line of step, section and helper texts on its own row', () => {
    render(<FormRenderer definition={definition} onSubmit={() => {}} />);
    const texts = ['.fh-step-progress__description', '.fh-field__helper:not(.fh-section__description)', '.fh-section__description'].map(
      (selector) => document.querySelector(selector) as HTMLElement,
    );
    for (const text of texts) {
      const lineHeight = Number.parseFloat(getComputedStyle(text).lineHeight);
      expect(getComputedStyle(text).whiteSpace).toBe('pre-line');
      expect(text.getBoundingClientRect().height).toBeGreaterThanOrEqual(lineHeight * 2 - 1);
    }
  });
});
