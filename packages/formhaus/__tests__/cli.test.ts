import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import pkg from '../package.json';
import { type Sandbox, sandbox } from './helpers';

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
});

afterEach(() => box.cleanup());

describe('cli', () => {
  it('prints help', () => {
    const result = box.run('--help');
    expect(result.code).toBe(0);
    expect(result.out).toContain('Usage: npx formhaus [setup] [options]');
  });

  it('prints the version', () => {
    expect(box.run('-v').out).toBe(pkg.version);
  });

  it('rejects an unknown command', () => {
    const result = box.run('install');
    expect(result.code).toBe(1);
    expect(result.err).toContain('Unknown command: install');
  });

  it('rejects an unknown option', () => {
    const result = box.run('--yes');
    expect(result.code).toBe(1);
    expect(result.err).toContain("Unknown option '--yes'");
  });
});
