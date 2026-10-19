import { chmodSync } from 'node:fs';
import { relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Context } from '../src/context';
import { command, findOnPath } from '../src/which';
import { onWindows, type Sandbox, sandbox } from './helpers';

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
});

afterEach(() => box.cleanup());

function windows(env: NodeJS.ProcessEnv): Context {
  return { home: box.home, cwd: box.home, env, platform: 'win32', dryRun: false, force: false, verbose: false };
}

describe.skipIf(onWindows)('Windows resolution', () => {
  it('finds claude.cmd through PATHEXT and ignores relative PATH entries', () => {
    box.write('claude.cmd', '');
    box.write('tools/claude.cmd', '');
    for (const file of ['claude.cmd', 'tools/claude.cmd']) chmodSync(box.path(file), 0o755);
    const ctx = windows({ PATH: `.;${relative(process.cwd(), box.path('tools'))};;${box.bin}`, PATHEXT: '.EXE;.CMD' });
    expect(findOnPath(ctx, 'claude')).toBeUndefined();
    box.fakeBin('claude.cmd');
    expect(findOnPath(ctx, 'claude')).toBe(`${box.bin}/claude.cmd`);
  });

  it('runs a .cmd through the absolute cmd.exe with a quoted path', () => {
    const ctx = windows({ ComSpec: 'C:\\Windows\\System32\\cmd.exe' });
    expect(command(ctx, 'C:\\Program Files\\nodejs\\claude.cmd', ['mcp', 'add'])).toEqual({
      file: 'C:\\Windows\\System32\\cmd.exe',
      args: ['/d', '/s', '/c', '""C:\\Program Files\\nodejs\\claude.cmd" mcp add"'],
      verbatim: true,
    });
  });

  it('runs an .exe directly', () => {
    const exe = 'C:\\Users\\me\\.local\\bin\\claude.exe';
    expect(command(windows({}), exe, ['mcp'])).toEqual({ file: exe, args: ['mcp'], verbatim: false });
  });
});

describe.skipIf(onWindows)('platform specifics', () => {
  it('lists Claude Desktop on Linux for manual setup', () => {
    box.write('.config/Claude/.keep', '');
    const result = box.run();
    expect(result.out).toMatch(/– Claude Desktop\s+add it by hand/);
    expect(box.exists('.config/Claude/claude_desktop_config.json')).toBe(false);
  });

  it('configures Claude Desktop in APPDATA on Windows', () => {
    box.write('AppData/Roaming/Claude/.keep', '');
    box.platform = 'win32';
    expect(box.run().out).toContain('Formhaus is ready in Claude Desktop.');
    expect(box.exists('AppData/Roaming/Claude/claude_desktop_config.json')).toBe(true);
  });
});
