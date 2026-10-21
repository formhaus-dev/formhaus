import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import createFormSkill from '../../../plugins/formhaus/skills/formhaus-create-form/SKILL.md';
import { type Agent, type Change, type Context, SERVER, SERVER_NAME, type State } from './context';
import { display, step, writeAsset } from './files';
import { jsonServerState, readJsonObject } from './json-config';
import { command, findOnPath } from './which';

const NAME = 'Claude Code';
const PLUGIN_PREFIX = `${SERVER_NAME}@`;
const SHIPPED_SKILLS = [
  'e929afc9f58a267647341d962283d84749a18028e5ec2c4bd770a214c26a7c25',
  '7288b74973a7668592f0baef836793aaf8591f3468546c87ff0c2335c8380065',
  '4638f4303a3907af4f6c077dd52251cb2e909875fe6010641e9932333ce0f351',
  'ede6c4601f398cf8e64569a3426f197fb61138183a9563d17202edef8fa93787',
  'c4e52ae30d4edadf5c2f7354d7144708ccd4283a111efbd81343255bd86a8432',
  'd8723887ee8892d280d89315ddc184c075a1a0ba7b8712a2b2ee3d5ceaa55fb1',
  '294b831463b121340236234aae4edceaa2276c3102632ac6c6c9f846e6f42db7',
  '29753c57bb8dffd57558151af47d9a33415c62df8fbb9c9473fcfc2fefb1a324',
  '4fdebec9585425f0d7d6d9921e7b5e4beb36eed496f1d611f9bbe77499551d44',
];
const CLAUDE_ADD_ARGS = ['mcp', 'add', '--scope', 'user', SERVER_NAME, '--', SERVER.command, ...SERVER.args];

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

function userConfig(ctx: Context): string {
  return ctx.env.CLAUDE_CONFIG_DIR ? join(ctx.env.CLAUDE_CONFIG_DIR, '.claude.json') : join(ctx.home, '.claude.json');
}

function userServer(ctx: Context) {
  return jsonServerState(readJsonObject(ctx, userConfig(ctx)));
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
      step(ctx, NAME, 'MCP server', userConfig(ctx), () => addServer(ctx, claude)),
      step(ctx, NAME, 'form skill', skill, () => (hasPlugin(ctx) ? 'present' : writeAsset(ctx, skill, createFormSkill, SHIPPED_SKILLS))),
      ...projectWarning(ctx),
    ];
  },
};
