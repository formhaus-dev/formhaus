import { readFileSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { onWindows, type Sandbox, sandbox } from './helpers';

const SKILL = '.claude/skills/formhaus-create-form/SKILL.md';
const RULE = 'app/.cursor/rules/formhaus.mdc';
const repoFile = (path: string) => readFileSync(join(__dirname, '../../..', path), 'utf8');
const SHIPPED_RULE = repoFile('.cursor/rules/formhaus.mdc');
const SHIPPED_SKILL = repoFile('plugins/formhaus/skills/formhaus-create-form/SKILL.md');

let box: Sandbox;

beforeEach(() => {
  box = sandbox();
  box.write('.cursor/.keep', '');
  box.write('app/package.json', '{}');
  box.fakeBin('claude');
  box.write('.claude.json', JSON.stringify({ mcpServers: { formhaus: { command: 'npx', args: ['-y', '@formhaus/mcp'] } } }));
  box.cwd = box.path('app');
});

afterEach(() => box.cleanup());

describe.skipIf(onWindows)('edited assets', () => {
  it.each([
    ['Cursor rule', RULE, SHIPPED_RULE],
    ['Claude Code skill', SKILL, SHIPPED_SKILL],
  ])('keeps an edited %s on a rerun', (_, file, shipped) => {
    box.run();
    expect(box.read(file)).toBe(shipped);
    box.write(file, `${shipped}\nMy own rule.\n`);
    const result = box.run();
    expect(result.code).toBe(0);
    expect(box.read(file)).toBe(`${shipped}\nMy own rule.\n`);
    expect(result.out).toContain('has your edits, left unchanged');
    expect(result.out).toContain('Run npx formhaus --force to replace it.');
    expect(box.exists(`${file}.bak`)).toBe(false);
  });

  it.each([
    ['Cursor rule', RULE, SHIPPED_RULE],
    ['Claude Code skill', SKILL, SHIPPED_SKILL],
  ])('replaces an edited %s with --force and backs up the edits over an older backup', (_, file, shipped) => {
    box.write(file, 'first edit');
    box.write(`${file}.bak`, 'older backup');
    const result = box.run('--force');
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/replaced\s+\S+ \(backup: /);
    expect(box.read(file)).toBe(shipped);
    expect(box.read(`${file}.bak`)).toBe('first edit');
    expect(box.exists(`${file}.bak.tmp`)).toBe(false);
    box.write(file, 'second edit');
    box.run('--force');
    expect(box.read(`${file}.bak`)).toBe('second edit');
  });

  it('leaves an unchanged asset alone with --force', () => {
    box.run();
    const result = box.run('--force');
    expect(result.out).toContain('Everything is already set up.');
    expect(box.exists(`${RULE}.bak`)).toBe(false);
  });

  it('keeps first-backup behavior for MCP configs with --force', () => {
    box.write('.cursor/mcp.json', '{"theme":"dark"}');
    box.write('.cursor/mcp.json.bak', 'older');
    box.run('--force');
    expect(box.read('.cursor/mcp.json.bak')).toBe('older');
  });

  it('refuses a linked backup with --force', () => {
    box.write(RULE, 'my edit');
    box.write('secret', 'keep me');
    symlinkSync(box.path('secret'), box.path(`${RULE}.bak`));
    const result = box.run('--force');
    expect(result.code).toBe(1);
    expect(result.out).toContain('is a symbolic link');
    expect(box.read('secret')).toBe('keep me');
    expect(box.read(RULE)).toBe('my edit');
  });

  it('reports edits and forced replacements in a dry run without writing', () => {
    box.write(RULE, 'my edit');
    box.write(SKILL, 'my skill');
    const kept = box.run('--dry-run');
    expect(kept.out).toMatch(/formhaus rule\s+has your edits, will leave unchanged/);
    const forced = box.run('--dry-run', '--force');
    expect(forced.out).toMatch(/formhaus rule\s+will replace/);
    expect(forced.out).toMatch(/formhaus-create-form skill\s+will replace/);
    expect(box.read(RULE)).toBe('my edit');
    expect(box.read(SKILL)).toBe('my skill');
    expect(box.exists(`${RULE}.bak`)).toBe(false);
    expect(box.exists(`${SKILL}.bak`)).toBe(false);
  });
});

describe.skipIf(onWindows)('project root', () => {
  it.each([
    ['a .git directory', 'repo/.git/HEAD'],
    ['a .git file', 'repo/.git'],
    ['a package.json', 'repo/package.json'],
    ['a .cursor directory', 'repo/.cursor/.keep'],
  ])('writes the rule at the nearest ancestor with %s', (_, marker) => {
    box.write(marker, '');
    box.write('repo/src/forms/.keep', '');
    box.cwd = box.path('repo/src/forms');
    const result = box.run();
    expect(result.code).toBe(0);
    expect(box.read('repo/.cursor/rules/formhaus.mdc')).toBe(SHIPPED_RULE);
    expect(box.exists('repo/src/forms/.cursor')).toBe(false);
  });

  it('explains the skip outside a project', () => {
    box.write('notes/drafts/.keep', '');
    box.cwd = box.path('notes/drafts');
    const result = box.run();
    expect(result.code).toBe(0);
    expect(result.out).toMatch(/Cursor\s+formhaus rule\s+skipped, not in a project\s+~\/notes\/drafts/);
    expect(result.out).toContain('Run npx formhaus inside a project to add the Cursor rule.');
    expect(box.exists('notes/drafts/.cursor')).toBe(false);
  });

  it('never treats the home directory as a project', () => {
    box.write('.git/HEAD', '');
    box.write('package.json', '{}');
    box.write('notes/.keep', '');
    box.cwd = box.home;
    expect(box.run().out).toMatch(/skipped, not in a project\s+~\n/);
    box.cwd = box.path('notes');
    expect(box.run().out).toMatch(/skipped, not in a project\s+~\/notes\n/);
    expect(box.exists('.cursor/rules')).toBe(false);
  });

  it('refuses a linked directory between the root and the rule', () => {
    box.write('repo/.git/HEAD', '');
    box.write('elsewhere/.keep', '');
    symlinkSync(box.path('elsewhere'), box.path('repo/.cursor'));
    box.write('repo/src/.keep', '');
    box.cwd = box.path('repo/src');
    const result = box.run();
    expect(result.code).toBe(1);
    expect(result.out).toContain('is a symbolic link');
    expect(box.exists('elsewhere/rules')).toBe(false);
  });

  it('plans the rule at the root in a dry run without writing', () => {
    box.write('repo/.git/HEAD', '');
    box.write('repo/src/.keep', '');
    box.cwd = box.path('repo/src');
    const result = box.run('--dry-run');
    expect(result.out).toMatch(/formhaus rule\s+will add\s+~\/repo\/\.cursor\/rules\/formhaus\.mdc/);
    expect(box.exists('repo/.cursor')).toBe(false);
  });
});
