import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { onWindows, type Sandbox, sandbox } from './helpers';

vi.mock('../../../.cursor/rules/formhaus.mdc', () => ({ default: 'new rule\n' }));
vi.mock('../../../plugins/formhaus/skills/formhaus-create-form/SKILL.md', () => ({ default: 'new skill\n' }));

const repoFile = (path: string) => readFileSync(join(__dirname, '../../..', path), 'utf8');

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

describe.skipIf(onWindows)('previously shipped assets', () => {
  it.each([
    ['Cursor rule', 'app/.cursor/rules/formhaus.mdc', '.cursor/rules/formhaus.mdc', 'new rule\n'],
    [
      'Claude Code skill',
      '.claude/skills/formhaus-create-form/SKILL.md',
      'plugins/formhaus/skills/formhaus-create-form/SKILL.md',
      'new skill\n',
    ],
  ])('updates an unedited 0.14.2 %s', (_, file, source, current) => {
    box.write(file, repoFile(source));
    const result = box.run();
    expect(result.code).toBe(0);
    expect(result.out).not.toContain('has your edits');
    expect(box.read(file)).toBe(current);
  });

  it('plans the update in a dry run without writing', () => {
    box.write('app/.cursor/rules/formhaus.mdc', repoFile('.cursor/rules/formhaus.mdc'));
    expect(box.run('--dry-run').out).toContain('will update Cursor rule');
    expect(box.read('app/.cursor/rules/formhaus.mdc')).toBe(repoFile('.cursor/rules/formhaus.mdc'));
  });
});
