import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { version } from '../package.json';
import { onWindows, type Sandbox, sandbox } from './helpers';

const CLI = join(__dirname, '../dist/cli.js');
const SKILL = '.claude/skills/formhaus-create-form/SKILL.md';
const built = existsSync(CLI);

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
});

afterEach(() => box.cleanup());

function runBuilt(...argv: string[]) {
  return spawnSync(process.execPath, [CLI, ...argv], {
    cwd: box.cwd,
    encoding: 'utf8',
    env: { PATH: box.bin, HOME: box.home, USERPROFILE: box.home },
  });
}

describe.skipIf(!built || onWindows)('built cli (run pnpm build first)', () => {
  it('prints the package version', () => {
    const result = runBuilt('--version');
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe(version);
  });

  it('plans changes on a dry run and writes nothing', () => {
    box.fakeBin('claude');
    box.write('.cursor/.keep', '');
    const result = runBuilt('--dry-run');
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Dry run: nothing is written.');
    expect(result.stdout).toContain('will add');
    expect(box.exists('.cursor/mcp.json')).toBe(false);
    expect(box.exists(SKILL)).toBe(false);
    expect(box.claudeCalls()).toEqual([]);
  });

  it('writes the bundled skill text', () => {
    box.fakeBin('claude');
    expect(runBuilt().status).toBe(0);
    expect(box.read(SKILL)).toBe(readFileSync(join(__dirname, '../../../plugins/formhaus/skills/formhaus-create-form/SKILL.md'), 'utf8'));
  });
});
