import { AGENTS, MANUAL_AGENTS } from './agents';
import { type Change, type Context, GUIDE_URL, SERVER, SERVER_NAME, type State } from './context';

export type Print = (line: string) => void;

const LABELS: Record<State, [string, string]> = {
  added: ['added', 'will add'],
  updated: ['updated', 'will update'],
  replaced: ['replaced', 'will replace'],
  present: ['already set up', 'already set up'],
  kept: ['has your edits, left unchanged', 'has your edits, will leave unchanged'],
  different: ['different server, check it', 'different server, check it'],
  skipped: ['skipped, not in a project', 'skipped, not in a project'],
  failed: ['failed', 'failed'],
};

function label(ctx: Context, state: State): string {
  return LABELS[state][ctx.dryRun ? 1 : 0];
}

function printChanges(ctx: Context, changes: Change[], print: Print): void {
  const width = (pick: (change: Change) => string) => Math.max(...changes.map((change) => pick(change).length));
  const agentWidth = width((change) => change.agent);
  const itemWidth = width((change) => change.item);
  const stateWidth = width((change) => label(ctx, change.state));
  for (const change of changes) {
    const row = [change.agent.padEnd(agentWidth), change.item.padEnd(itemWidth), label(ctx, change.state).padEnd(stateWidth), change.where];
    print(`  ${row.join('  ')}`);
    if (change.note) print(`    ${change.note}`);
  }
}

function printManual(names: string[], print: Print): void {
  print(names.length > 0 ? `Set up by hand: ${names.join(', ')}` : 'Set up any other MCP client by hand:');
  print(`  Add a stdio MCP server named "${SERVER_NAME}" with command "${SERVER.command}" and args ${JSON.stringify(SERVER.args)}.`);
  print(`  Guide: ${GUIDE_URL}`);
}

export function setup(ctx: Context, print: Print): number {
  const agents = AGENTS.filter((agent) => agent.detect(ctx));
  const manual = MANUAL_AGENTS.filter((agent) => agent.detect(ctx)).map((agent) => agent.name);
  if (ctx.dryRun) print('Dry run: nothing is written.');
  if (agents.length === 0) {
    print('No supported coding agent found. Formhaus sets up Claude Code, Codex, Cursor and Claude Desktop.');
    printManual(manual, print);
    return 0;
  }
  print(`Found ${agents.map((agent) => agent.name).join(', ')}.`);
  const changes = agents.flatMap((agent) => agent.apply(ctx));
  print('');
  printChanges(ctx, changes, print);
  if (manual.length > 0) {
    print('');
    printManual(manual, print);
  }
  const failed = changes.some((change) => change.state === 'failed');
  const changed = changes.some((change) => change.state === 'added' || change.state === 'updated' || change.state === 'replaced');
  print('');
  const different = changes.some((change) => change.state === 'different');
  if (different) {
    print(
      `A "${SERVER_NAME}" server with another command is configured where marked. Formhaus left it unchanged. Check that you trust it.`,
    );
  }
  if (failed) print('Some steps failed. Fix the errors above and run formhaus again.');
  else if (ctx.dryRun) print('Run without --dry-run to apply.');
  else if (changed) print('Done. Restart your agents to load the Formhaus MCP server.');
  else if (!different) print('Everything is already set up.');
  return failed ? 1 : 0;
}
