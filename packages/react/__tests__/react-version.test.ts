import { version } from 'react';
import { version as domVersion } from 'react-dom';
import { describe, expect, it } from 'vitest';

const expected = process.env.FORMHAUS_REACT_VERSION;

describe('React version', () => {
  it.runIf(expected)('runs the tests on the React version CI installed', () => {
    expect({ react: version, dom: domVersion }).toEqual({ react: expected, dom: expected });
  });
});
