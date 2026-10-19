import { join } from 'node:path';
import cursorRule from '../../../.cursor/rules/formhaus.mdc';
import { claudeCode } from './claude-code';
import type { Agent, Context } from './context';
import { display, findProjectRoot, isDirectory, step, writeAsset } from './files';
import { addJsonServer } from './json-config';
import { addTomlServer } from './toml-config';
import { findOnPath } from './which';

function codexHome(ctx: Context): string {
  return ctx.env.CODEX_HOME || join(ctx.home, '.codex');
}

function claudeDesktopDir(ctx: Context): string | undefined {
  if (ctx.platform === 'darwin') return join(ctx.home, 'Library', 'Application Support', 'Claude');
  if (ctx.platform === 'win32') return join(ctx.env.APPDATA || join(ctx.home, 'AppData', 'Roaming'), 'Claude');
  return undefined;
}

function found(ctx: Context, directory: string, bin: string): boolean {
  return isDirectory(directory) || findOnPath(ctx, bin) !== undefined;
}

const SHIPPED_RULES = ['1bb79502ba88f1d38bef0bb3f34ede713f94487643496eae94ca6be7d2c8a32c'];

const codex: Agent = {
  name: 'Codex',
  detect: (ctx) => found(ctx, codexHome(ctx), 'codex'),
  apply(ctx) {
    const file = join(codexHome(ctx), 'config.toml');
    return [step(ctx, 'Codex', 'MCP server', file, () => addTomlServer(ctx, file))];
  },
};

const cursor: Agent = {
  name: 'Cursor',
  detect: (ctx) => found(ctx, join(ctx.home, '.cursor'), 'cursor'),
  apply(ctx) {
    const file = join(ctx.home, '.cursor', 'mcp.json');
    const changes = [step(ctx, 'Cursor', 'MCP server', file, () => addJsonServer(ctx, file))];
    const root = findProjectRoot(ctx);
    if (root === undefined) {
      return [...changes, { agent: 'Cursor', item: 'Cursor rule', where: display(ctx, ctx.cwd), state: 'skipped' }];
    }
    const rule = join(root, '.cursor', 'rules', 'formhaus.mdc');
    changes.push(step(ctx, 'Cursor', 'Cursor rule', rule, () => writeAsset(ctx, rule, cursorRule, SHIPPED_RULES, root)));
    return changes;
  },
};

const claudeDesktop: Agent = {
  name: 'Claude Desktop',
  detect: (ctx) => {
    const directory = claudeDesktopDir(ctx);
    return directory !== undefined && isDirectory(directory);
  },
  apply(ctx) {
    const directory = claudeDesktopDir(ctx)!;
    const file = join(directory, 'claude_desktop_config.json');
    return [step(ctx, 'Claude Desktop', 'MCP server', file, () => addJsonServer(ctx, file))];
  },
};

export const AGENTS: Agent[] = [claudeCode, codex, cursor, claudeDesktop];

interface ManualAgent {
  name: string;
  detect(ctx: Context): boolean;
}

export const MANUAL_AGENTS: ManualAgent[] = [
  { name: 'Windsurf', detect: (ctx) => found(ctx, join(ctx.home, '.codeium', 'windsurf'), 'windsurf') },
  { name: 'Gemini CLI', detect: (ctx) => found(ctx, join(ctx.home, '.gemini'), 'gemini') },
  { name: 'OpenCode', detect: (ctx) => found(ctx, join(ctx.home, '.config', 'opencode'), 'opencode') },
  { name: 'Claude Desktop', detect: (ctx) => ctx.platform === 'linux' && isDirectory(join(ctx.home, '.config', 'Claude')) },
  { name: 'VS Code', detect: (ctx) => findOnPath(ctx, 'code') !== undefined },
];
