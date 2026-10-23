import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkDefinition, FormDefinitionError, FormEngine, parseDefinition, type FormDefinition } from '../../src';

const invalid = {
  id: 'texts',
  title: 'Texts',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'a',
      title: 'A',
      fields: [
        { key: 'name', type: 'text', label: 'Name', validation: { pattern: '(', minLength: 5, maxLength: 2 } },
        { key: 'toString', type: 'text', label: 'Reserved' },
      ],
      routes: [{ to: 'nowhere' }],
    },
    { id: 'a', title: 'B', fields: [{ key: 'later', type: 'text', label: 'Later', show: [{ field: 'nam', eq: 'x' }] }] },
  ],
} as unknown as FormDefinition;

function thrown(run: () => unknown): FormDefinitionError {
  try {
    run();
  } catch (error) {
    if (error instanceof FormDefinitionError) return error;
  }
  throw new Error('expected a FormDefinitionError');
}

const located = (issues: { code: string; path: string }[]) => issues.map(({ code, path }) => `${path} ${code}`);

afterEach(() => vi.unstubAllEnvs());

describe('definition error text', () => {
  it('keeps the full text from checkDefinition', () => {
    expect(checkDefinition(invalid).filter((issue) => issue.severity === 'error')).toMatchInlineSnapshot(`
      [
        {
          "code": "duplicate-step-id",
          "hint": "Give each step a unique id.",
          "message": "/steps/1/id: step id "a" is already used by /steps/0. Give each step a unique id.",
          "path": "/steps/1/id",
          "severity": "error",
        },
        {
          "code": "route-target",
          "hint": "Use "a", or null to end the form here.",
          "message": "/steps/0/routes/0/to: "nowhere" is not a step id. Use "a", or null to end the form here.",
          "path": "/steps/0/routes/0/to",
          "severity": "error",
        },
        {
          "code": "reserved-key",
          "hint": "Rename the field key.",
          "message": "/steps/0/fields/1/key: "toString" is a built-in object property name. Rename the field key.",
          "path": "/steps/0/fields/1/key",
          "severity": "error",
        },
        {
          "code": "unknown-field",
          "hint": "Use "name".",
          "message": "/steps/1/fields/0/show/0/field: "nam" is not a field key. Use "name".",
          "path": "/steps/1/fields/0/show/0/field",
          "severity": "error",
        },
        {
          "code": "min-greater-than-max",
          "hint": "Lower minLength or raise maxLength.",
          "message": "/steps/0/fields/0/validation/minLength: minLength (5) is greater than maxLength (2). Lower minLength or raise maxLength.",
          "path": "/steps/0/fields/0/validation/minLength",
          "severity": "error",
        },
        {
          "code": "invalid-pattern",
          "hint": "Fix the pattern or escape special characters with a backslash.",
          "message": "/steps/0/fields/0/validation/pattern: "(" is not a valid regular expression. Fix the pattern or escape special characters with a backslash.",
          "path": "/steps/0/fields/0/validation/pattern",
          "severity": "error",
        },
      ]
    `);
  });

  it('keeps the full text in development', () => {
    const error = thrown(() => new FormEngine(invalid));
    expect(error.issues).toEqual(checkDefinition(invalid).filter((issue) => issue.severity === 'error'));
  });

  it('lists path and code per issue in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = thrown(() => new FormEngine(invalid));
    const expected = located(checkDefinition(invalid).filter((issue) => issue.severity === 'error'));
    expect(located(error.issues)).toEqual(expected);
    expect(error.issues.map((issue) => issue.message)).toEqual(error.issues.map(({ code, path }) => `${path}: ${code}`));
    expect(error.issues.every((issue) => issue.hint === undefined)).toBe(true);
    expect(error.message).toBe(['Invalid form definition:', ...error.issues.map((issue) => issue.message)].join('\n'));
  });

  it('shows / for the root path in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(thrown(() => new FormEngine([] as unknown as FormDefinition)).message).toBe('Invalid form definition:\n/: invalid-type');
  });

  it('keeps the full text from parseDefinition in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(thrown(() => parseDefinition(invalid)).issues).toEqual(checkDefinition(invalid).filter((issue) => issue.severity === 'error'));
  });
});
