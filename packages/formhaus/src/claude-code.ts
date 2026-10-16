import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import createFormSkill from '../../../plugins/formhaus/skills/formhaus-create-form/SKILL.md';
import { type Agent, type Change, type Context, SERVER, SERVER_NAME, type State } from './context';
import { configRoot, display, step, writeIfChanged } from './files';
import { jsonServerState, readJsonObject } from './json-config';
import { command, findOnPath } from './which';

const NAME = 'Claude Code';
const PLUGIN_PREFIX = `${SERVER_NAME}@`;
export const CLAUDE_ADD_ARGS = ['mcp', 'add', '--scope', 'user', SERVER_NAME, '--', SERVER.command, ...SERVER.args];

function configDir(ctx: Context): string {
  return ctx.env.CLAUDE_CONFIG_DIR || join(ctx.home, '.claude');
}

function enabledPlugins(ctx: Context): Record<string, unknown> {
  try {
    const enabled = readJsonObject(ctx, join(configDir(ctx), 'settings.json'))?.enabledPlugins;
    return typeof enabled === 'object' && enabled !== null ? (enabled as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function installedForUser(installs: unknown): boolean {
  return (
    Array.isArray(installs) &&
    installs.some((install) => typeof install === 'object' && install !== null && (install.scope ?? 'user') === 'user')
  );
}

function hasPlugin(ctx: Context): boolean {
  const plugins = readJsonObject(ctx, join(configDir(ctx), 'plugins', 'installed_plugins.json'))?.plugins;
  if (typeof plugins !== 'object' || plugins === null) return false;
  const enabled = enabledPlugins(ctx);
  return Object.entries(plugins).some(
    ([id, installs]) => id.startsWith(PLUGIN_PREFIX) && installedForUser(installs) && enabled[id] === true,
  );
}

function userServer(ctx: Context) {
  const file = ctx.env.CLAUDE_CONFIG_DIR ? join(ctx.env.CLAUDE_CONFIG_DIR, '.claude.json') : join(ctx.home, '.claude.json');
  return jsonServerState(readJsonObject(ctx, file));
}

function projectWarning(ctx: Context): Change[] {
  const file = join(ctx.cwd, '.mcp.json');
  try {
    if (jsonServerState(readJsonObject(ctx, file)) !== 'different') return [];
  } catch {
    return [];
  }
  return [{ agent: NAME, item: 'project MCP server', where: display(ctx, file), state: 'different' }];
}

function addServer(ctx: Context, claude: string): State {
  if (hasPlugin(ctx)) return 'present';
  const existing = userServer(ctx);
  if (existing !== 'missing') return existing;
  if (ctx.dryRun) return 'added';
  const { file, args, verbatim } = command(ctx, claude, CLAUDE_ADD_ARGS);
  const result = spawnSync(file, args, { encoding: 'utf8', env: ctx.env, windowsVerbatimArguments: verbatim });
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
    const claude = findOnPath(ctx, 'claude')!;
    const skill = join(configDir(ctx), 'skills', 'formhaus-create-form', 'SKILL.md');
    return [
      step(ctx, NAME, 'MCP server', `claude mcp add --scope user ${SERVER_NAME}`, () => addServer(ctx, claude)),
      step(ctx, NAME, 'formhaus-create-form skill', skill, () =>
        hasPlugin(ctx) ? 'present' : writeIfChanged(ctx, skill, createFormSkill, configRoot(ctx, configDir(ctx))),
      ),
      ...projectWarning(ctx),
    ];
  },
};
