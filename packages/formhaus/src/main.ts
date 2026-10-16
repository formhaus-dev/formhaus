import { parseArgs } from 'node:util';
import { version } from '../package.json';
import type { Context } from './context';
import { type Print, setup } from './run';

const HELP = `Usage: npx formhaus [setup] [options]

Adds the Formhaus MCP server (npx -y @formhaus/mcp) to the coding agents
installed on this machine: Claude Code, Codex, Cursor and Claude Desktop.
Installs the formhaus-create-form skill in Claude Code and, inside a project,
the Formhaus rule in .cursor/rules at the project root. Running it again
changes nothing. Your edits to the skill and the rule are kept.

Options:
  --dry-run      Show the planned changes and write nothing
  --force        Replace your edited skill and rule, saving them as .bak
  -h, --help     Show this help
  -v, --version  Show the version`;

export function main(argv: string[], ctx: Omit<Context, 'dryRun' | 'force'>, print: Print, printError: Print): number {
  let parsed: ReturnType<typeof parse>;
  try {
    parsed = parse(argv);
  } catch (error) {
    printError(`${error instanceof Error ? error.message : String(error)}\nRun npx formhaus --help for usage.`);
    return 1;
  }
  const { values, positionals } = parsed;
  if (values.help || values.version) {
    print(values.help ? HELP : version);
    return 0;
  }
  if (positionals.length > 1 || (positionals.length === 1 && positionals[0] !== 'setup')) {
    printError(`Unknown command: ${positionals.join(' ')}\nRun npx formhaus --help for usage.`);
    return 1;
  }
  return setup({ ...ctx, dryRun: values['dry-run'] === true, force: values.force === true }, print);
}

function parse(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'dry-run': { type: 'boolean' },
      force: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });
}
