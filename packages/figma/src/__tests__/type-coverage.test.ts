import { describe, expect, it } from 'vitest';
import { BUILT_IN_TYPES } from '../../../core/src/validation/type-checks';
import { FIELD_DRAWINGS } from '../roles';

describe('field type coverage', () => {
  it('draws every built-in field type of @formhaus/core', () => {
    expect(BUILT_IN_TYPES.filter((type) => !(type in FIELD_DRAWINGS))).toEqual([]);
  });

  it('lists no field type that core does not know', () => {
    expect(Object.keys(FIELD_DRAWINGS).filter((type) => !BUILT_IN_TYPES.includes(type))).toEqual([]);
  });
});
