import { chmodSync, readlinkSync, rmSync, statSync, symlinkSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onWindows, type Sandbox, sandbox } from './helpers';

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
  box.write('app/package.json', '{}');
  box.write('.cursor/.keep', '');
  box.write('secret', 'keep me');
});

afterEach(() => box.cleanup());

function expectRefused(result: { code: number; out: string }) {
  expect(result.code).toBe(1);
  expect(result.out).toContain('is a symbolic link');
  expect(box.read('secret')).toBe('keep me');
}

describe.skipIf(onWindows)('symbolic links', () => {
  it.each([
    ['the backup', 'app/.cursor/rules/formhaus.mdc.bak'],
    ['the temporary file', 'app/.cursor/rules/formhaus.mdc.tmp'],
    ['the rule', 'app/.cursor/rules/formhaus.mdc'],
  ])('refuses to write when %s is a link', (_, link) => {
    box.write('app/.cursor/rules/.keep', '');
    if (link.endsWith('.mdc')) box.write('app/.cursor/rules/formhaus.mdc.bak', 'old');
    else box.write('app/.cursor/rules/formhaus.mdc', 'old rule');
    symlinkSync(box.path('secret'), box.path(link));
    box.cwd = box.path('app');
    expectRefused(box.run());
  });

  it('refuses a dangling link without creating its target', () => {
    box.write('app/.cursor/rules/.keep', '');
    symlinkSync(box.path('missing'), box.path('app/.cursor/rules/formhaus.mdc'));
    box.cwd = box.path('app');
    const result = box.run();
    expect(result.code).toBe(1);
    expect(box.exists('missing')).toBe(false);
  });

  it('refuses a linked rules directory inside the project', () => {
    box.write('elsewhere/.keep', '');
    box.write('app/.cursor/.keep', '');
    symlinkSync(box.path('elsewhere'), box.path('app/.cursor/rules'));
    box.cwd = box.path('app');
    expect(box.run().out).toContain('is a symbolic link');
    expect(box.exists('elsewhere/formhaus.mdc')).toBe(false);
  });

  it('refuses a linked Claude Code skill directory', () => {
    box.fakeBin('claude');
    box.write('elsewhere/.keep', '');
    box.write('.claude/skills/.keep', '');
    symlinkSync(box.path('elsewhere'), box.path('.claude/skills/formhaus-create-form'));
    expect(box.run().out).toContain('~/.claude/skills/formhaus-create-form is a symbolic link');
    expect(box.exists('elsewhere/SKILL.md')).toBe(false);
  });

  it('refuses a linked Cursor config directory', () => {
    box.cleanup();
    box = sandbox();
    box.write('elsewhere/mcp.json', '{}');
    symlinkSync(box.path('elsewhere'), box.path('.cursor'));
    expect(box.run().out).toContain('~/.cursor is a symbolic link');
    expect(box.read('elsewhere/mcp.json')).toBe('{}');
    expect(box.exists('elsewhere/mcp.json.bak')).toBe(false);
  });

  it('allows a linked home directory', () => {
    const linked = `${box.home}-link`;
    symlinkSync(box.home, linked);
    try {
      box.home = linked;
      box.env.HOME = linked;
      expect(box.run().code).toBe(0);
      expect(JSON.parse(box.read('.cursor/mcp.json')).mcpServers.formhaus).toBeDefined();
    } finally {
      rmSync(linked);
    }
  });

  it('refuses a linked JSON config', () => {
    box.write('secret', '{}');
    symlinkSync(box.path('secret'), box.path('.cursor/mcp.json'));
    const result = box.run();
    expect(result.out).toContain('~/.cursor/mcp.json is a symbolic link');
    expect(box.read('secret')).toBe('{}');
    expect(readlinkSync(box.path('.cursor/mcp.json'))).toBe(box.path('secret'));
  });
});

describe.skipIf(onWindows)('backups', () => {
  it('keeps the first backup on later changes', () => {
    box.write('.cursor/mcp.json', '{"theme":"dark"}');
    box.run();
    box.write('.cursor/mcp.json', '{"theme":"light"}');
    box.run();
    expect(box.read('.cursor/mcp.json.bak')).toBe('{"theme":"dark"}');
    expect(box.exists('.cursor/mcp.json.tmp')).toBe(false);
  });
});

describe.skipIf(onWindows)('permissions', () => {
  it('keeps the mode of a private config', () => {
    box.write('.cursor/mcp.json', '{"mcpServers":{"other":{"command":"x","env":{"KEY":"secret"}}}}');
    chmodSync(box.path('.cursor/mcp.json'), 0o600);
    box.run();
    expect(JSON.parse(box.read('.cursor/mcp.json')).mcpServers.formhaus).toBeDefined();
    expect(statSync(box.path('.cursor/mcp.json')).mode & 0o777).toBe(0o600);
  });
});

describe.skipIf(onWindows)('Codex inline servers', () => {
  it.each([
    ['an inline mcp_servers table', 'mcp_servers = { other = { command = "x" } }\n'],
    ['an inline table with spaces', '  mcp_servers   = {}\n'],
  ])('aborts on %s without changing the file', (_, toml) => {
    box.write('.codex/config.toml', toml);
    const result = box.run();
    expect(result.code).toBe(1);
    expect(result.out).toContain('sets mcp_servers inline. Add the formhaus server there by hand');
    expect(box.read('.codex/config.toml')).toBe(toml);
    expect(box.exists('.codex/config.toml.bak')).toBe(false);
  });
});

describe.skipIf(onWindows)('Codex quoted tables', () => {
  it.each([
    ['a quoted parent key', '["mcp_servers".formhaus]\ncommand = "other"\n'],
    ['single quotes on both keys', '[\'mcp_servers\'."formhaus"]\ncommand = "other"\n'],
    ['spaces around the dot', '[ "mcp_servers" . formhaus ]\ncommand = "other"\n'],
    ['a quoted parent with a sub-table', '["mcp_servers".formhaus.env]\nKEY = "x"\n'],
    ['a quoted servers table', '["mcp_servers"]\nformhaus = { command = "other" }\n'],
    ['a quoted dotted key', '"mcp_servers".formhaus.command = "other"\n'],
  ])('leaves a different server under %s unchanged', (_, toml) => {
    box.write('.codex/config.toml', toml);
    const result = box.run();
    expect(result.out).toContain('different server, check it');
    expect(box.read('.codex/config.toml')).toBe(toml);
  });

  it('recognizes our server under a quoted parent key', () => {
    const toml = '["mcp_servers".formhaus]\ncommand = "npx"\nargs = ["-y", "@formhaus/mcp"]\n';
    box.write('.codex/config.toml', toml);
    box.run();
    expect(box.read('.codex/config.toml')).toBe(toml);
    expect(box.exists('.codex/config.toml.bak')).toBe(false);
  });

  it('adds the server next to other quoted servers', () => {
    box.write('.codex/config.toml', '["mcp_servers".other]\ncommand = "x"\n');
    box.run();
    expect(box.read('.codex/config.toml')).toBe(
      '["mcp_servers".other]\ncommand = "x"\n\n[mcp_servers.formhaus]\ncommand = "npx"\nargs = ["-y", "@formhaus/mcp"]\n',
    );
  });

  it.each([
    ['an escaped parent key', '["mcp\\u005fservers".formhaus]\ncommand = "other"\n'],
    ['an array of tables', '[[mcp_servers.formhaus]]\ncommand = "other"\n'],
  ])('refuses %s', (_, toml) => {
    box.write('.codex/config.toml', toml);
    const result = box.run();
    expect(result.code).toBe(1);
    expect(result.out).toContain('Formhaus cannot read');
    expect(box.read('.codex/config.toml')).toBe(toml);
  });
});
