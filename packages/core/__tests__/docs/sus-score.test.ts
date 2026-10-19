import { describe, expect, it } from 'vitest';
import template from '../../../../templates/usability-questionnaire.json';
import { susScore } from '../../../../docs/recipes/snippets/sus-score';
import { FormEngine } from '../../src/engine';

const answers = (odd: string, even: string) =>
  Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`sus${index + 1}`, (index + 1) % 2 === 1 ? odd : even]));

describe('susScore', () => {
  it('scores the best and the worst answers', () => {
    expect(susScore(answers('5', '1'))).toBe(100);
    expect(susScore(answers('1', '5'))).toBe(0);
    expect(susScore(answers('3', '3'))).toBe(50);
  });

  it('returns null for a missing answer', () => {
    const { sus7, ...rest } = answers('5', '1');
    expect(susScore(rest)).toBeNull();
    expect(susScore({})).toBeNull();
  });

  it('returns null for values that are not the template option values', () => {
    for (const bad of [true, ['5'], 5, '0', '6', '', 'na', null]) {
      expect(susScore({ ...answers('5', '1'), sus3: bad })).toBeNull();
    }
    expect(susScore(Object.fromEntries(Array.from({ length: 10 }, (_, i) => [`sus${i + 1}`, true])))).toBeNull();
  });

  it('accepts the values the template submits', () => {
    const engine = new FormEngine(template.definition as never);
    for (const [key, value] of Object.entries(answers('4', '2'))) engine.setValue(key, value);
    expect(susScore(engine.getSubmitValues())).toBe(75);
  });
});
