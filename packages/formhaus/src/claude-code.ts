import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import createFormSkill from '../../../plugins/formhaus/skills/formhaus-create-form/SKILL.md';
import { type Agent, type Context, SERVER, SERVER_NAME, type State } from './context';
import { step, writeIfChanged } from './files';
import { hasJsonServer, readJsonObject } from './json-config';
import { command, findOnPath } from './which';

const NAME = 'Claude Code';
const PLUGIN_ID = 'formhaus@formhaus';
export const CLAUDE_ADD_ARGS = ['mcp', 'add', '--scope', 'user', SERVER_NAME, '--', SERVER.command, ...SERVER.args];

function configDir(ctx: Context): string {
  return ctx.env.CLAUDE_CONFIG_DIR || join(ctx.home, '.claude');
}

function hasPlugin(ctx: Context): boolean {
  const plugins = readJsonObject(ctx, join(configDir(ctx), 'plugins', 'installed_plugins.json'))?.plugins;
  return typeof plugins === 'object' && plugins !== null && PLUGIN_ID in plugins;
}

function hasServer(ctx: Context): boolean {
  const file = ctx.env.CLAUDE_CONFIG_DIR ? join(ctx.env.CLAUDE_CONFIG_DIR, '.claude.json') : join(ctx.home, '.claude.json');
  const config = readJsonObject(ctx, file);
  const projects = config?.projects as Record<string, Record<string, unknown>> | undefined;
  return hasJsonServer(config) || hasJsonServer(projects?.[ctx.cwd]) || hasJsonServer(readJsonObject(ctx, join(ctx.cwd, '.mcp.json')));
}

function addServer(ctx: Context, claude: string): State {
  if (hasPlugin(ctx) || hasServer(ctx)) return 'present';
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
        hasPlugin(ctx) ? 'present' : writeIfChanged(ctx, skill, createFormSkill),
      ),
    ];
  },
};
