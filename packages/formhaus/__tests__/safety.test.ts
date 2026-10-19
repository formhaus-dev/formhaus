import { chmodSync, readdirSync, readlinkSync, rmSync, statSync, symlinkSync } from 'node:fs';
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
    ['the rule', 'app/.cursor/rules/formhaus.mdc'],
  ])('refuses to write when %s is a link', (_, link) => {
    box.write('app/.cursor/rules/.keep', '');
    if (link.endsWith('.mdc')) box.write('app/.cursor/rules/formhaus.mdc.bak', 'old');
    else box.write('app/.cursor/rules/formhaus.mdc', 'old rule');
    symlinkSync(box.path('secret'), box.path(link));
    box.cwd = box.path('app');
    expectRefused(box.run());
  });

  it('never writes through links at the old temporary file names', () => {
    box.write('app/.cursor/rules/formhaus.mdc', 'old rule');
    box.write('app/.cursor/rules/formhaus.mdc.bak', 'old');
    symlinkSync(box.path('secret'), box.path('app/.cursor/rules/formhaus.mdc.tmp'));
    symlinkSync(box.path('secret'), box.path('app/.cursor/rules/formhaus.mdc.bak.tmp'));
    box.cwd = box.path('app');
    expect(box.run('--force').code).toBe(0);
    expect(box.read('secret')).toBe('keep me');
    expect(box.read('app/.cursor/rules/formhaus.mdc.bak')).toBe('old rule');
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

  it('refuses a linked .cursor directory inside the project', () => {
    box.write('elsewhere/.keep', '');
    symlinkSync(box.path('elsewhere'), box.path('app/.cursor'));
    box.cwd = box.path('app');
    expect(box.run().out).toContain('is a symbolic link');
    expect(box.exists('elsewhere/rules/formhaus.mdc')).toBe(false);
  });

  it('writes through a linked Claude Code skill directory', () => {
    box.fakeBin('claude');
    box.write('elsewhere/.keep', '');
    box.write('.claude/skills/.keep', '');
    symlinkSync(box.path('elsewhere'), box.path('.claude/skills/formhaus-create-form'));
    expect(box.run().code).toBe(0);
    expect(box.read('elsewhere/SKILL.md')).toContain('formhaus');
  });

  it('writes through a linked Cursor config directory', () => {
    box.cleanup();
    box = sandbox();
    box.write('elsewhere/mcp.json', '{}');
    symlinkSync(box.path('elsewhere'), box.path('.cursor'));
    expect(box.run().code).toBe(0);
    expect(JSON.parse(box.read('elsewhere/mcp.json')).mcpServers.formhaus).toBeDefined();
    expect(box.read('elsewhere/mcp.json.bak')).toBe('{}');
  });

  it('writes through a linked Codex config directory', () => {
    box.write('elsewhere/config.toml', 'model = "x"\n');
    symlinkSync(box.path('elsewhere'), box.path('.codex'));
    expect(box.run().code).toBe(0);
    expect(box.read('elsewhere/config.toml')).toContain('[mcp_servers.formhaus]');
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
    expect(readdirSync(box.path('.cursor')).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });

  it('mentions the backup only when this run created it', () => {
    box.write('.cursor/mcp.json', '{"theme":"dark"}');
    expect(box.run().out).toContain('Config backups were saved as .bak.');
    expect(box.run('--verbose').out).toContain('      backup: ~/.cursor/mcp.json.bak');
    box.write('.cursor/mcp.json', '{"theme":"light"}');
    const later = box.run().out;
    expect(later).not.toContain('backup');
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

const OUR_TOML = '[mcp_servers.formhaus]\ncommand = "npx"\nargs = ["-y", "@formhaus/mcp"]\n';

function expectUnchanged(toml: string) {
  expect(box.read('.codex/config.toml')).toBe(toml);
  expect(box.exists('.codex/config.toml.bak')).toBe(false);
}

describe.skipIf(onWindows)('Codex refusals', () => {
  it.each([
    ['an unclosed table header', '[mcp_servers\ncommand = "x"\n', 'is not valid TOML'],
    ['an unterminated string', 'model = "o3\n', 'is not valid TOML'],
    ['a duplicate key', 'model = "a"\nmodel = "b"\n', 'is not valid TOML'],
    ['a scalar mcp_servers', 'mcp_servers = 1\n', 'has an mcp_servers value that is not a table'],
    ['an array of mcp_servers tables', '[[mcp_servers]]\ncommand = "x"\n', 'has an mcp_servers value that is not a table'],
    ['an inline mcp_servers table', 'mcp_servers = { other = { command = "x" } }\n', 'cannot extend'],
    ['an empty inline table with spaces', '  mcp_servers   = {}\n', 'cannot extend'],
  ])('refuses %s without changing the file', (_, toml, reason) => {
    box.write('.codex/config.toml', toml);
    const result = box.run();
    expect(result.code).toBe(1);
    expect(result.text).toContain(reason);
    expect(result.text).toContain('Add the formhaus server by hand. The file was not changed.');
    expectUnchanged(toml);
  });
});

describe.skipIf(onWindows)('Codex existing servers', () => {
  it.each([
    ['a quoted parent key', '["mcp_servers".formhaus]\ncommand = "other"\n'],
    ['single quotes on both keys', '[\'mcp_servers\'."formhaus"]\ncommand = "other"\n'],
    ['spaces around the dot', '[ "mcp_servers" . formhaus ]\ncommand = "other"\n'],
    ['a quoted parent with a sub-table', '["mcp_servers".formhaus.env]\nKEY = "x"\n'],
    ['a quoted servers table', '["mcp_servers"]\nformhaus = { command = "other" }\n'],
    ['a quoted dotted key', '"mcp_servers".formhaus.command = "other"\n'],
    ['an escaped parent key', '["mcp\\u005fservers".formhaus]\ncommand = "other"\n'],
    ['an escaped server table', '[mcp_servers."form\\u0068aus"]\ncommand = "other"\n'],
    ['an escaped server key', '[mcp_servers]\n"form\\u0068aus" = { command = "other" }\n'],
    ['an escaped dotted server key', '[mcp_servers]\n"form\\u0068aus".command = "other"\n'],
    ['an escaped dotted parent key', '"mcp\\u005fservers".formhaus.command = "x"\n'],
    ['an array of tables', '[[mcp_servers.formhaus]]\ncommand = "other"\n'],
    [
      'a quoted table after a string ending in quotes',
      'args = ["-c", """echo "hello""""] # prints "hello"\n[mcp_servers."formhaus"]\ncommand = "sh"\n',
    ],
  ])('leaves a different server under %s unchanged', (_, toml) => {
    box.write('.codex/config.toml', toml);
    const result = box.run();
    expect(result.out).toContain('another formhaus server is configured, check it');
    expectUnchanged(toml);
  });

  it.each([
    ['a quoted parent key', '["mcp_servers".formhaus]\ncommand = "npx"\nargs = ["-y", "@formhaus/mcp"]\n'],
    ['an escaped server table', '[mcp_servers."form\\u0068aus"]\ncommand = "npx"\nargs = ["-y", "@formhaus/mcp"]\n'],
    ['an inline server', 'mcp_servers = { formhaus = { command = "npx", args = ["-y", "@formhaus/mcp"] } }\n'],
    [
      'a string ending in quotes before it',
      `args = ["-c", """echo "hello""""] # prints "hello"\n${OUR_TOML.replace('formhaus', '"formhaus"')}`,
    ],
    ['CRLF line endings', OUR_TOML.replaceAll('\n', '\r\n')],
    ['a byte order mark', `\uFEFF${OUR_TOML}`],
  ])('recognizes our server under %s', (_, toml) => {
    box.write('.codex/config.toml', toml);
    const result = box.run();
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/already set up/);
    expectUnchanged(toml);
  });
});

describe.skipIf(onWindows)('Codex appends', () => {
  it.each([
    ['other quoted servers', '["mcp_servers".other]\ncommand = "x"\n'],
    ['dotted server keys', 'mcp_servers.other.command = "x"\n'],
    ['a Windows path in a value', 'notify = ["C:\\\\notify.py"]\n'],
    ['a Windows path in a project table', '[projects."C:\\\\Users\\\\me\\\\repo"]\ntrust_level = "trusted"\n'],
    ['a multi-line array', 'args = [\n  "C:\\\\x",\n  ["C:\\\\y", 1],\n  "a\\\\b" ,\n]\n'],
    ['a multi-line string', 'text = """\n"form\\u0068aus" = 1\n[mcp_servers."\\u0066"]\n"""\n'],
    ['a literal string holding our table', `notes = '''\n${OUR_TOML}'''\n`],
    ['a Windows path in another server', '[mcp_servers.other]\ncommand = "C:\\\\tools\\\\x.exe"\n'],
    ['an integer beyond the safe range', 'max_tokens = 9223372036854775807\n'],
    ['an escaped key outside mcp_servers', '[projects]\n"C:\\\\repo".trust_level = "trusted"\n'],
    ['a byte order mark', '\uFEFFmodel = "o3"\n'],
  ])('adds the server next to %s', (_, toml) => {
    box.write('.codex/config.toml', toml);
    expect(box.run().code).toBe(0);
    expect(box.read('.codex/config.toml')).toBe(`${toml}\n${OUR_TOML}`);
    expect(box.read('.codex/config.toml.bak')).toBe(toml);
  });

  it.each([
    ['a trailing newline', 'model = "o3"\r\n', '\r\n'],
    ['no trailing newline', 'model = "o3"\r\n[projects]\r\nx = 1', '\r\n\r\n'],
  ])('keeps CRLF line endings with %s', (_, toml, separator) => {
    box.write('.codex/config.toml', toml);
    expect(box.run().code).toBe(0);
    expect(box.read('.codex/config.toml')).toBe(toml + separator + OUR_TOML.replaceAll('\n', '\r\n'));
  });
});
