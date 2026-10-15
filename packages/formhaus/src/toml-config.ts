import { type Context, SERVER, SERVER_NAME, type State } from './context';
import { readText, writeText } from './files';

const NAME = `(?:${SERVER_NAME}|"${SERVER_NAME}"|'${SERVER_NAME}')`;
const TABLE = new RegExp(`^\\s*\\[\\s*mcp_servers\\s*\\.\\s*${NAME}\\s*[\\].]`, 'm');
const DOTTED_KEY = new RegExp(`^\\s*mcp_servers\\s*\\.\\s*${NAME}\\s*[.=]`, 'm');
const SERVERS_TABLE = /^\s*\[\s*mcp_servers\s*\]\s*(?:#.*)?$/m;
const NEXT_TABLE = /^\s*\[/m;
const SERVER_KEY = new RegExp(`^\\s*${NAME}\\s*[.=]`, 'm');

export function hasTomlServer(text: string): boolean {
  if (TABLE.test(text) || DOTTED_KEY.test(text)) return true;
  const table = SERVERS_TABLE.exec(text);
  if (!table) return false;
  const rest = text.slice(table.index + table[0].length);
  const end = NEXT_TABLE.exec(rest);
  return SERVER_KEY.test(end ? rest.slice(0, end.index) : rest);
}

export const TOML_BLOCK = [
  `[mcp_servers.${SERVER_NAME}]`,
  `command = ${JSON.stringify(SERVER.command)}`,
  `args = [${SERVER.args.map((arg) => JSON.stringify(arg)).join(', ')}]`,
  '',
].join('\n');

export function addTomlServer(ctx: Context, file: string): State {
  const text = readText(file) ?? '';
  if (hasTomlServer(text)) return 'present';
  const separator = text.trim() === '' ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  writeText(ctx, file, text.trim() === '' ? TOML_BLOCK : text + separator + TOML_BLOCK);
  return 'added';
}
