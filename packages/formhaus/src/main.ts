import { parseArgs } from 'node:util';
import { version } from '../package.json';
import type { Context } from './context';
import { type Print, setup } from './run';

const HELP = `Usage: npx formhaus [setup] [options]

Adds the Formhaus MCP server (npx -y @formhaus/mcp) to the coding agents
installed on this machine: Claude Code, Codex, Cursor and Claude Desktop.
Installs the formhaus-create-form skill in Claude Code and, inside a project,
the Formhaus rule in .cursor/rules. Running it again changes nothing.

Options:
  --dry-run      Show the planned changes and write nothing
  -y, --yes      Run without prompts (formhaus never prompts)
  -h, --help     Show this help
  -v, --version  Show the version`;

export function main(argv: string[], ctx: Omit<Context, 'dryRun'>, print: Print, printError: Print): number {
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
  return setup({ ...ctx, dryRun: values['dry-run'] === true }, print);
}

function parse(argv: string[]) {
  return parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      'dry-run': { type: 'boolean' },
      yes: { type: 'boolean', short: 'y' },
      help: { type: 'boolean', short: 'h' },
      version: { type: 'boolean', short: 'v' },
    },
  });
}
