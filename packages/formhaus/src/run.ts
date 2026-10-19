import { AGENTS, MANUAL_AGENTS } from './agents';
import { APP_URL, type Change, type Context, GUIDE_URL, SERVER, SERVER_NAME, START_URL, type State } from './context';

export type Print = (line: string) => void;

const WIDTH = 79;
const INDENT = '  ';
const DETAIL = '      ';

type Mark = 'ok' | 'manual' | 'failed' | 'warning';

const SYMBOLS: Record<Mark, [string, string]> = {
  ok: ['✓', '32'],
  manual: ['–', '2'],
  failed: ['✗', '31'],
  warning: ['!', '33'],
};

interface Row {
  mark: Mark;
  name: string;
  summary: string;
  notes: string[];
  details: string[];
}

function useColor(ctx: Context): boolean {
  return ctx.tty === true && !ctx.env.NO_COLOR && ctx.env.TERM !== 'dumb';
}

function paint(ctx: Context, code: string, text: string): string {
  return useColor(ctx) ? `\u001b[${code}m${text}\u001b[0m` : text;
}

function wrap(text: string, first: string, rest: string = first): string[] {
  const lines: string[] = [];
  let line = first;
  let empty = true;
  for (const word of text.split(' ')) {
    if (!empty && line.length + 1 + word.length > WIDTH) {
      lines.push(line);
      line = rest + word;
    } else line += (empty ? '' : ' ') + word;
    empty = false;
  }
  lines.push(line);
  return lines;
}

function list(names: string[]): string {
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function items(changes: Change[], state: State): string[] {
  return changes.filter((change) => change.state === state).map((change) => change.item);
}

function summary(ctx: Context, changes: Change[]): string {
  const will = (done: string, planned: string) => (ctx.dryRun ? planned : done);
  const parts: string[] = [];
  const add = (state: State, text: (names: string) => string) => {
    const names = items(changes, state);
    if (names.length > 0) parts.push(text(list(names)));
  };
  add('failed', (names) => `${names} failed`);
  for (const change of changes.filter((change) => change.state === 'different')) {
    const place = change.item === 'MCP server' ? 'is configured' : `in ${change.where}`;
    parts.push(`another ${SERVER_NAME} server ${place}, check it`);
  }
  add('added', (names) => `${will('added', 'will add')} ${names}`);
  add('updated', (names) => `${will('updated', 'will update')} ${names}`);
  add('replaced', (names) => `${will('replaced', 'will replace')} ${names}`);
  add('kept', (names) => `${names} ${names.includes(' and ') ? 'have' : 'has'} your edits, ${will('kept', 'will keep')}`);
  const active = changes.filter((change) => change.state !== 'skipped');
  if (active.length > 0 && active.every((change) => change.state === 'present')) parts.push('already set up');
  else add('present', (names) => `${names} already set up`);
  if (items(changes, 'skipped').length > 0) parts.push('run in a project to add the Cursor rule');
  return parts.join(' · ');
}

function details(change: Change): string[] {
  if (change.state === 'skipped') return [`no project found in ${change.where}`];
  return change.backup ? [change.where, `backup: ${change.backup}`] : [change.where];
}

function agentRow(ctx: Context, name: string, changes: Change[]): Row {
  const has = (state: State) => changes.some((change) => change.state === state);
  return {
    mark: has('failed') ? 'failed' : has('different') ? 'warning' : 'ok',
    name,
    summary: summary(ctx, changes),
    notes: changes.flatMap((change) => (change.note ? [change.note] : [])),
    details: changes.flatMap(details),
  };
}

const MANUAL_STEP = `Add a stdio MCP server named "${SERVER_NAME}" with command "${SERVER.command}" and args ${JSON.stringify(SERVER.args)}.`;

function manualRow(name: string): Row {
  return { mark: 'manual', name, summary: `add it by hand: ${GUIDE_URL}`, notes: [], details: [MANUAL_STEP] };
}

function printRows(ctx: Context, rows: Row[], print: Print): void {
  const width = Math.max(...rows.map((row) => row.name.length)) + 2;
  for (const row of rows) {
    const [symbol, code] = SYMBOLS[row.mark];
    const lead = `${INDENT}${symbol} ${row.name.padEnd(width)}`;
    const [first, ...rest] = wrap(row.summary, lead, ' '.repeat(lead.length));
    print(first.replace(symbol, paint(ctx, code, symbol)));
    for (const line of rest) print(line);
    for (const note of row.notes) for (const line of wrap(note, DETAIL)) print(line);
    if (ctx.verbose) for (const detail of row.details) for (const line of wrap(detail, DETAIL)) print(line);
  }
}

function printNext(ctx: Context, print: Print): void {
  print('');
  print(paint(ctx, '1', 'Next'));
  print(`${INDENT}1. Restart your agents.`);
  print(`${INDENT}2. Ask one: "Build a contact form with Formhaus: name, email, message."`);
  print(`${INDENT}3. Show it on your site: npm i @formhaus/core @formhaus/react`);
  print(`${INDENT}   For Vue use @formhaus/vue. Guide: ${START_URL}`);
  print(`${INDENT}   No site? Publish it and collect responses at ${APP_URL}`);
}

function printNoAgents(ctx: Context, manual: string[], print: Print): number {
  print('No supported coding agent found.');
  print('Formhaus sets up Claude Code, Codex, Cursor and Claude Desktop.');
  if (manual.length > 0) {
    print('');
    printRows(ctx, manual.map(manualRow), print);
  }
  print('');
  print('Set up any MCP client by hand:');
  for (const line of wrap(MANUAL_STEP, INDENT)) print(line);
  print(`${INDENT}Guide: ${GUIDE_URL}`);
  return 0;
}

export function setup(ctx: Context, print: Print): number {
  const agents = AGENTS.filter((agent) => agent.detect(ctx));
  const manual = MANUAL_AGENTS.filter((agent) => agent.detect(ctx)).map((agent) => agent.name);
  if (ctx.dryRun) print('Dry run: nothing is written.');
  if (agents.length === 0) return printNoAgents(ctx, manual, print);
  const applied = agents.map((agent) => ({ name: agent.name, changes: agent.apply(ctx) }));
  const changes = applied.flatMap((agent) => agent.changes);
  const rows = applied.map((agent) => agentRow(ctx, agent.name, agent.changes));
  const ready = rows.filter((row) => row.mark === 'ok').map((row) => row.name);
  const failed = rows.some((row) => row.mark === 'failed');
  const different = rows.some((row) => row.mark === 'warning');
  const changed = changes.some((change) => change.state === 'added' || change.state === 'updated' || change.state === 'replaced');
  const names = list(applied.map((agent) => agent.name));
  if (ctx.dryRun && changed) print(`Formhaus will set up ${names}.`);
  else if (ready.length === 0) print(`Formhaus could not finish setup in ${names}.`);
  else print(`Formhaus is ${changed ? 'ready' : 'already set up'} in ${list(ready)}.`);
  print('');
  printRows(ctx, [...rows, ...manual.map(manualRow)], print);
  if (different) {
    print('');
    const warning = `A "${SERVER_NAME}" server with another command is configured where marked. Formhaus left it unchanged. Check that you trust it.`;
    for (const line of wrap(warning, '')) print(line);
  }
  if (failed) {
    print('');
    print('Fix the errors above and run npx formhaus again.');
  }
  if (ctx.dryRun) {
    print('');
    print('Run without --dry-run to apply.');
    return failed ? 1 : 0;
  }
  if (ready.length > 0) printNext(ctx, print);
  const footer = [
    changes.some((change) => change.newBackup) ? 'Config backups were saved as .bak.' : '',
    ctx.verbose ? '' : 'See every file: npx formhaus --verbose',
  ].filter(Boolean);
  if (footer.length > 0) {
    print('');
    print(footer.join(' '));
  }
  return failed ? 1 : 0;
}
