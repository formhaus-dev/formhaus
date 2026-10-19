import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onWindows, type Sandbox, sandbox } from './helpers';

const DESKTOP = 'Library/Application Support/Claude';
const SERVER = { mcpServers: { formhaus: { command: 'npx', args: ['-y', '@formhaus/mcp'] } } };

const NEXT = [
  'Next',
  '  1. Restart your agents.',
  '  2. Ask one: "Build a contact form with Formhaus: name, email, message."',
  '  3. Show it on your site: npm i @formhaus/core @formhaus/react',
  '     For Vue use @formhaus/vue. Guide: https://formhaus.dev/guide/',
  '     No site? Publish it and collect responses at https://app.formhaus.dev',
];

const FIRST = [
  'Formhaus is ready in Claude Code, Codex, Cursor and Claude Desktop.',
  '',
  '  ✓ Claude Code     added MCP server and form skill',
  '  ✓ Codex           added MCP server',
  '  ✓ Cursor          added MCP server · run in a project to add the Cursor rule',
  '  ✓ Claude Desktop  added MCP server',
  '  – OpenCode        add it by hand: https://formhaus.dev/guide/mcp',
  '',
  ...NEXT,
  '',
  'Config backups were saved as .bak. See every file: npx formhaus --verbose',
];

const AGAIN = [
  'Formhaus is already set up in Claude Code, Codex, Cursor and Claude Desktop.',
  '',
  '  ✓ Claude Code     already set up',
  '  ✓ Codex           already set up',
  '  ✓ Cursor          already set up · run in a project to add the Cursor rule',
  '  ✓ Claude Desktop  already set up',
  '  – OpenCode        add it by hand: https://formhaus.dev/guide/mcp',
  '',
  ...NEXT,
  '',
  'See every file: npx formhaus --verbose',
];

const VERBOSE = [
  'Formhaus is already set up in Claude Code, Codex, Cursor and Claude Desktop.',
  '',
  '  ✓ Claude Code     already set up',
  '      ~/.claude.json',
  '      ~/.claude/skills/formhaus-create-form/SKILL.md',
  '  ✓ Codex           already set up',
  '      ~/.codex/config.toml',
  '      backup: ~/.codex/config.toml.bak',
  '  ✓ Cursor          already set up · run in a project to add the Cursor rule',
  '      ~/.cursor/mcp.json',
  '      no project found in ~',
  '  ✓ Claude Desktop  already set up',
  '      ~/Library/Application Support/Claude/claude_desktop_config.json',
  '  – OpenCode        add it by hand: https://formhaus.dev/guide/mcp',
  '      Add a stdio MCP server named "formhaus" with command "npx" and args',
  '      ["-y","@formhaus/mcp"].',
  '',
  ...NEXT,
];

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
  box.platform = 'darwin';
  box.fakeBin('claude');
  box.write('.codex/config.toml', 'model = "o3"\n');
  box.write('.cursor/.keep', '');
  box.write(`${DESKTOP}/.keep`, '');
  box.write('.config/opencode/.keep', '');
});

afterEach(() => box.cleanup());

const lines = (out: string) => out.split('\n');
const setUp = () => {
  box.run();
  box.write('.claude.json', JSON.stringify(SERVER));
};

describe.skipIf(onWindows)('output', () => {
  it('tells a first-time user what happened and what to do next', () => {
    const result = box.run();
    expect(result.code).toBe(0);
    expect(lines(result.out)).toEqual(FIRST);
  });

  it('says already set up on a second run and keeps the next steps', () => {
    setUp();
    const result = box.run();
    expect(result.code).toBe(0);
    expect(lines(result.out)).toEqual(AGAIN);
    expect(result.out).not.toMatch(/\badded\b/);
  });

  it('lists every file and backup with --verbose', () => {
    setUp();
    expect(lines(box.run('--verbose').out)).toEqual(VERBOSE);
  });

  it('keeps every line within 79 columns', () => {
    box.cwd = box.path(DESKTOP);
    for (const argv of [[], ['--verbose'], ['--dry-run', '--verbose']]) {
      for (const line of lines(box.run(...argv).out)) expect(line.length).toBeLessThanOrEqual(79);
    }
  });

  it('shows the failure, its fix, and exits with 1', () => {
    box.write('.cursor/mcp.json', '{');
    const result = box.run();
    expect(result.code).toBe(1);
    expect(lines(result.out).slice(0, 9)).toEqual([
      'Formhaus is ready in Claude Code, Codex and Claude Desktop.',
      '',
      '  ✓ Claude Code     added MCP server and form skill',
      '  ✓ Codex           added MCP server',
      '  ✗ Cursor          MCP server failed · run in a project to add the Cursor rule',
      '      ~/.cursor/mcp.json is not valid JSON. Fix it and run again. The file was',
      '      not changed.',
      '  ✓ Claude Desktop  added MCP server',
      '  – OpenCode        add it by hand: https://formhaus.dev/guide/mcp',
    ]);
    expect(result.out).toContain('\n\nFix the errors above and run npx formhaus again.\n\nNext\n');
  });

  it('leaves out the next steps in a dry run', () => {
    const result = box.run('--dry-run');
    expect(lines(result.out)[1]).toBe('Formhaus will set up Claude Code, Codex, Cursor and Claude Desktop.');
    expect(result.out).not.toContain('Next');
    expect(lines(result.out).at(-1)).toBe('Run without --dry-run to apply.');
  });
});

describe.skipIf(onWindows)('color', () => {
  const GREEN_CHECK = '\u001b[32m✓\u001b[0m';

  it('prints plain text when stdout is not a terminal', () => {
    expect(box.run().out).not.toContain('\u001b[');
  });

  it('colors the symbols and the Next heading on a terminal', () => {
    box.tty = true;
    const { out } = box.run();
    expect(out).toContain(`  ${GREEN_CHECK} Claude Code     added MCP server and form skill`);
    expect(out).toContain('  \u001b[2m–\u001b[0m OpenCode');
    expect(out).toContain('\n\u001b[1mNext\u001b[0m\n');
  });

  it('respects NO_COLOR and TERM=dumb on a terminal', () => {
    box.tty = true;
    box.env.NO_COLOR = '1';
    expect(box.run().out).not.toContain('\u001b[');
    box.env.NO_COLOR = undefined;
    box.env.TERM = 'dumb';
    expect(box.run().out).not.toContain('\u001b[');
  });

  it('colors a failure red', () => {
    box.tty = true;
    box.write('.cursor/mcp.json', '{');
    expect(box.run().out).toContain('  \u001b[31m✗\u001b[0m Cursor');
  });
});
