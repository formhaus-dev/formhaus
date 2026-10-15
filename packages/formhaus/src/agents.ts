import { existsSync } from 'node:fs';
import { join } from 'node:path';
import cursorRule from '../../../.cursor/rules/formhaus.mdc';
import { claudeCode } from './claude-code';
import type { Agent, Context } from './context';
import { findOnPath, isDirectory, step, writeIfChanged } from './files';
import { addJsonServer } from './json-config';
import { addTomlServer } from './toml-config';

function codexHome(ctx: Context): string {
  return ctx.env.CODEX_HOME || join(ctx.home, '.codex');
}

function claudeDesktopDir(ctx: Context): string {
  if (ctx.platform === 'darwin') return join(ctx.home, 'Library', 'Application Support', 'Claude');
  if (ctx.platform === 'win32') return join(ctx.env.APPDATA || join(ctx.home, 'AppData', 'Roaming'), 'Claude');
  return join(ctx.env.XDG_CONFIG_HOME || join(ctx.home, '.config'), 'Claude');
}

function found(ctx: Context, directory: string, bin: string): boolean {
  return isDirectory(directory) || findOnPath(ctx, bin) !== undefined;
}

function isProject(ctx: Context): boolean {
  return ctx.cwd !== ctx.home && existsSync(join(ctx.cwd, 'package.json'));
}

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
    if (!isProject(ctx)) return changes;
    const rule = join(ctx.cwd, '.cursor', 'rules', 'formhaus.mdc');
    changes.push(step(ctx, 'Cursor', 'formhaus rule', rule, () => writeIfChanged(ctx, rule, cursorRule)));
    return changes;
  },
};

const claudeDesktop: Agent = {
  name: 'Claude Desktop',
  detect: (ctx) => isDirectory(claudeDesktopDir(ctx)),
  apply(ctx) {
    const file = join(claudeDesktopDir(ctx), 'claude_desktop_config.json');
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
  { name: 'VS Code', detect: (ctx) => findOnPath(ctx, 'code') !== undefined },
];
