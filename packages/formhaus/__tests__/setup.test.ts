import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onWindows, type Sandbox, sandbox } from './helpers';

const SERVER = { command: 'npx', args: ['-y', '@formhaus/mcp'] };
const SKILL = '.claude/skills/formhaus-create-form/SKILL.md';
const CLAUDE_ADD = 'claude mcp add --scope user formhaus -- npx -y @formhaus/mcp';
const DESKTOP = 'Library/Application Support/Claude';
const repoFile = (path: string) => readFileSync(join(__dirname, '../../..', path), 'utf8');

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
});

afterEach(() => box.cleanup());

describe.skipIf(onWindows)('detection', () => {
  it('reports no agents and prints manual setup on an empty machine', () => {
    const result = box.run();
    expect(result.code).toBe(0);
    expect(result.out).toContain('No supported coding agent found');
    expect(result.out).toContain('"npx" and args ["-y","@formhaus/mcp"]');
  });

  it('finds agents by config directory and by binary on PATH', () => {
    box.fakeBin('claude');
    box.write('.codex/.keep', '');
    box.fakeBin('cursor');
    box.write(`${DESKTOP}/.keep`, '');
    box.platform = 'darwin';
    expect(box.run('--dry-run').out).toContain('Found Claude Code, Codex, Cursor, Claude Desktop.');
  });

  it('lists agents it cannot configure for manual setup', () => {
    box.write('.cursor/.keep', '');
    box.write('.gemini/.keep', '');
    box.fakeBin('code');
    const { out } = box.run();
    expect(out).toContain('Set up by hand: Gemini CLI, VS Code');
    expect(box.exists('.gemini/settings.json')).toBe(false);
  });
});

describe.skipIf(onWindows)('setup', () => {
  it('configures every detected agent with the documented formats', () => {
    box.fakeBin('claude');
    box.write('.codex/.keep', '');
    box.write('.cursor/.keep', '');
    box.write(`${DESKTOP}/.keep`, '');
    box.platform = 'darwin';
    const result = box.run('setup');
    expect(result.code).toBe(0);
    expect(box.claudeCalls()).toEqual([CLAUDE_ADD]);
    expect(box.read(SKILL)).toBe(repoFile('plugins/formhaus/skills/formhaus-create-form/SKILL.md'));
    expect(box.read('.codex/config.toml')).toBe('[mcp_servers.formhaus]\ncommand = "npx"\nargs = ["-y", "@formhaus/mcp"]\n');
    expect(JSON.parse(box.read('.cursor/mcp.json'))).toEqual({ mcpServers: { formhaus: SERVER } });
    expect(JSON.parse(box.read(`${DESKTOP}/claude_desktop_config.json`))).toEqual({ mcpServers: { formhaus: SERVER } });
    expect(result.out).toContain('Done.');
  });

  it('installs the Cursor rule only inside a project', () => {
    box.write('.cursor/.keep', '');
    box.write('app/package.json', '{}');
    box.run();
    expect(box.exists('.cursor/rules/formhaus.mdc')).toBe(false);
    box.cwd = box.path('app');
    box.run();
    expect(box.read('app/.cursor/rules/formhaus.mdc')).toBe(repoFile('.cursor/rules/formhaus.mdc'));
  });

  const installPlugin = (installs: unknown[], enabled?: boolean) => {
    box.write('.claude/plugins/installed_plugins.json', JSON.stringify({ version: 2, plugins: { 'formhaus@formhaus': installs } }));
    if (enabled !== undefined) box.write('.claude/settings.json', JSON.stringify({ enabledPlugins: { 'formhaus@formhaus': enabled } }));
  };

  it('skips the Claude Code skill and server when the Formhaus plugin is installed and enabled', () => {
    box.fakeBin('claude');
    installPlugin([{ scope: 'user', version: '0.1.0' }], true);
    const { out } = box.run();
    expect(box.claudeCalls()).toEqual([]);
    expect(box.exists(SKILL)).toBe(false);
    expect(out).toContain('already set up');
  });

  it.each([
    ['disabled', [{ scope: 'user' }], false],
    ['missing from enabledPlugins', [{ scope: 'user' }], undefined],
    ['registered without installations', [], true],
    ['installed only for a project', [{ scope: 'project', projectPath: '/elsewhere' }], true],
  ])('sets up Claude Code when the Formhaus plugin is %s', (_, installs, enabled) => {
    box.fakeBin('claude');
    installPlugin(installs, enabled);
    box.run();
    expect(box.claudeCalls()).toEqual([CLAUDE_ADD]);
    expect(box.exists(SKILL)).toBe(true);
  });

  it('fails with the claude output when claude mcp add fails', () => {
    box.fakeBin('claude', 1);
    const result = box.run();
    expect(result.code).toBe(1);
    expect(result.out).toContain('claude said no');
    expect(result.out).toContain('Some steps failed');
  });
});

describe.skipIf(onWindows)('idempotency', () => {
  it('changes nothing on the second run', () => {
    box.fakeBin('claude');
    box.write('.codex/config.toml', 'model = "o3"\n');
    box.write('.cursor/mcp.json', '{}');
    box.run();
    box.write('.claude.json', JSON.stringify({ mcpServers: { formhaus: SERVER } }));
    const before = [box.read('.codex/config.toml'), box.read('.cursor/mcp.json'), box.read(SKILL)];
    const second = box.run();
    expect(second.code).toBe(0);
    expect(second.out).toContain('Everything is already set up.');
    expect(second.out).not.toMatch(/\badded\b/);
    expect([box.read('.codex/config.toml'), box.read('.cursor/mcp.json'), box.read(SKILL)]).toEqual(before);
    expect(box.claudeCalls()).toEqual([CLAUDE_ADD]);
  });

  it.each([
    ['a table', '[mcp_servers.formhaus]\ncommand = "node"\n'],
    ['a quoted table', '[mcp_servers."formhaus"]\ncommand = "node"\n'],
    ['a dotted key', 'mcp_servers.formhaus.command = "node"\n'],
    ['an inline table', '[mcp_servers]\nformhaus = { command = "node" }\n'],
  ])('keeps an existing Codex server written as %s', (_, toml) => {
    box.write('.codex/config.toml', toml);
    box.run();
    expect(box.read('.codex/config.toml')).toBe(toml);
    expect(box.exists('.codex/config.toml.bak')).toBe(false);
  });
});

describe.skipIf(onWindows)('merging', () => {
  it('keeps other JSON servers and settings and writes a backup', () => {
    box.write('.cursor/mcp.json', JSON.stringify({ theme: 'dark', mcpServers: { other: { command: 'other' } } }));
    const original = box.read('.cursor/mcp.json');
    box.run();
    expect(JSON.parse(box.read('.cursor/mcp.json'))).toEqual({
      theme: 'dark',
      mcpServers: { other: { command: 'other' }, formhaus: SERVER },
    });
    expect(box.read('.cursor/mcp.json.bak')).toBe(original);
  });

  it('keeps an existing formhaus JSON entry as is', () => {
    const custom = JSON.stringify({ mcpServers: { formhaus: { command: 'node', args: ['local.js'] } } });
    box.write('.cursor/mcp.json', custom);
    box.run();
    expect(box.read('.cursor/mcp.json')).toBe(custom);
  });

  it('appends to Codex config without touching other tables', () => {
    const toml = 'model = "o3"\n\n[mcp_servers.other]\ncommand = "other"\n[mcp_servers]\nother2 = { command = "x" }';
    box.write('.codex/config.toml', toml);
    box.run();
    expect(box.read('.codex/config.toml')).toBe(`${toml}\n\n[mcp_servers.formhaus]\ncommand = "npx"\nargs = ["-y", "@formhaus/mcp"]\n`);
    expect(box.read('.codex/config.toml.bak')).toBe(toml);
  });

  it.each([
    ['malformed JSON', '{"mcpServers": {', 'is not valid JSON'],
    ['a JSON array', '[]', 'must contain a JSON object'],
    ['a non-object mcpServers', '{"mcpServers": []}', '"mcpServers" in ~/.cursor/mcp.json is not an object'],
  ])('aborts on %s without overwriting', (_, text, message) => {
    box.write('.cursor/mcp.json', text);
    box.write('.codex/.keep', '');
    const result = box.run();
    expect(result.code).toBe(1);
    expect(result.out).toContain(message);
    expect(box.read('.cursor/mcp.json')).toBe(text);
    expect(box.exists('.cursor/mcp.json.bak')).toBe(false);
    expect(box.exists('.codex/config.toml')).toBe(true);
  });
});

describe.skipIf(onWindows)('dry run', () => {
  it('prints the plan and writes nothing', () => {
    box.fakeBin('claude');
    box.write('.codex/.keep', '');
    box.write('.cursor/mcp.json', '{}');
    const result = box.run('--dry-run');
    expect(result.code).toBe(0);
    expect(result.out).toContain('Dry run: nothing is written.');
    expect(result.out).toMatch(/Cursor\s+MCP server\s+will add\s+~\/\.cursor\/mcp\.json/);
    expect(box.claudeCalls()).toEqual([]);
    expect(box.exists('.codex/config.toml')).toBe(false);
    expect(box.exists(SKILL)).toBe(false);
    expect(box.read('.cursor/mcp.json')).toBe('{}');
  });
});
