import { describe, expect, it } from 'vitest';
import { slowPattern } from '../../src/definition-validation/slow-pattern';

describe('slowPattern', () => {
  it('reads the text after \\k as pattern unless it is a group name', () => {
    expect(
      ['(?<s>a)\\k<(a+)+>', '(?<s>a)\\k<(a|a)+>', '(?<s>a)a*\\k<s>*$', '(?<s>a)a*\\k<\\u{73}>*$', '(?<s>a)a*\\k<\\u0073>*$'].map(
        (pattern) => slowPattern(pattern),
      ),
    ).toEqual(['nested', 'nested', 'adjacent', 'adjacent', 'adjacent']);
  });
});
