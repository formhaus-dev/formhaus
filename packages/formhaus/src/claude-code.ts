import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import createFormSkill from '../../../plugins/formhaus/skills/formhaus-create-form/SKILL.md';
import { type Agent, type Context, SERVER, SERVER_NAME, type State } from './context';
import { findOnPath, readText, step, writeIfChanged } from './files';
import { hasJsonServer } from './json-config';

const NAME = 'Claude Code';
const PLUGIN_ID = 'formhaus@formhaus';
export const CLAUDE_ADD_ARGS = ['mcp', 'add', '--scope', 'user', SERVER_NAME, '--', SERVER.command, ...SERVER.args];

function configDir(ctx: Context): string {
  return ctx.env.CLAUDE_CONFIG_DIR || join(ctx.home, '.claude');
}

function readJson(file: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(readText(file) ?? '{}');
  } catch {
    return undefined;
  }
}

function hasPlugin(ctx: Context): boolean {
  const installed = readJson(join(configDir(ctx), 'plugins', 'installed_plugins.json'));
  const plugins = installed?.plugins;
  return typeof plugins === 'object' && plugins !== null && PLUGIN_ID in plugins;
}

function hasServer(ctx: Context): boolean {
  const file = ctx.env.CLAUDE_CONFIG_DIR ? join(ctx.env.CLAUDE_CONFIG_DIR, '.claude.json') : join(ctx.home, '.claude.json');
  const config = readJson(file);
  const projects = config?.projects as Record<string, Record<string, unknown>> | undefined;
  return hasJsonServer(config) || hasJsonServer(projects?.[ctx.cwd]);
}

function addServer(ctx: Context): State {
  if (hasPlugin(ctx) || hasServer(ctx)) return 'present';
  if (ctx.dryRun) return 'added';
  const result = spawnSync('claude', CLAUDE_ADD_ARGS, { encoding: 'utf8', env: ctx.env, shell: ctx.platform === 'win32' });
  if (result.status !== 0) {
    const output = `${result.stderr ?? ''}${result.stdout ?? ''}`.trim() || result.error?.message || `exit code ${result.status}`;
    throw new Error(`claude ${CLAUDE_ADD_ARGS.join(' ')} failed: ${output}`);
  }
  return 'added';
}

export const claudeCode: Agent = {
  name: NAME,
  detect: (ctx) => findOnPath(ctx, 'claude') !== undefined,
  apply(ctx) {
    const changes = [step(ctx, NAME, 'MCP server', `claude mcp add --scope user ${SERVER_NAME}`, () => addServer(ctx))];
    if (hasPlugin(ctx)) return changes;
    const skill = join(configDir(ctx), 'skills', 'formhaus-create-form', 'SKILL.md');
    changes.push(step(ctx, NAME, 'formhaus-create-form skill', skill, () => writeIfChanged(ctx, skill, createFormSkill)));
    return changes;
  },
};
