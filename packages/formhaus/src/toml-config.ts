import { type Context, isOurServer, SERVER, SERVER_NAME, type ServerState, SetupError, type State } from './context';
import { display, readText, writeText } from './files';

const NAME = `(?:${SERVER_NAME}|"${SERVER_NAME}"|'${SERVER_NAME}')`;
const TABLE = new RegExp(`^\\s*\\[\\s*mcp_servers\\s*\\.\\s*${NAME}\\s*[\\].]`, 'm');
const OUR_TABLE = new RegExp(`^\\s*\\[\\s*mcp_servers\\s*\\.\\s*${NAME}\\s*\\]\\s*(?:#.*)?$`, 'm');
const DOTTED_KEY = new RegExp(`^\\s*mcp_servers\\s*\\.\\s*${NAME}\\s*[.=]`, 'm');
const SERVERS_TABLE = /^\s*\[\s*mcp_servers\s*\]\s*(?:#.*)?$/m;
const NEXT_TABLE = /^\s*\[/m;
const INLINE_SERVERS = /^\s*mcp_servers\s*=/m;
const SERVER_KEY = new RegExp(`^\\s*${NAME}\\s*[.=]`, 'm');

function section(text: string, header: RegExp): string | undefined {
  const match = header.exec(text);
  if (!match) return undefined;
  const rest = text.slice(match.index + match[0].length);
  const end = NEXT_TABLE.exec(rest);
  return end ? rest.slice(0, end.index) : rest;
}

function value(body: string, key: string): unknown {
  const line = new RegExp(`^\\s*${key}\\s*=\\s*(.*?)\\s*$`, 'm').exec(body);
  try {
    return line ? JSON.parse(line[1]) : undefined;
  } catch {
    return undefined;
  }
}

export function tomlServerState(text: string): ServerState {
  const ours = section(text, OUR_TABLE);
  if (ours !== undefined) return isOurServer(value(ours, 'command'), value(ours, 'args')) ? 'present' : 'different';
  const servers = section(text, SERVERS_TABLE);
  const declared = TABLE.test(text) || DOTTED_KEY.test(text) || (servers !== undefined && SERVER_KEY.test(servers));
  return declared ? 'different' : 'missing';
}

export const TOML_BLOCK = [
  `[mcp_servers.${SERVER_NAME}]`,
  `command = ${JSON.stringify(SERVER.command)}`,
  `args = [${SERVER.args.map((arg) => JSON.stringify(arg)).join(', ')}]`,
  '',
].join('\n');

export function addTomlServer(ctx: Context, file: string): State {
  const text = readText(file) ?? '';
  const existing = tomlServerState(text);
  if (existing !== 'missing') return existing;
  if (INLINE_SERVERS.test(text)) {
    throw new SetupError(`${display(ctx, file)} sets mcp_servers inline. Add the formhaus server there by hand. The file was not changed.`);
  }
  const separator = text.trim() === '' ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  writeText(ctx, file, text.trim() === '' ? TOML_BLOCK : text + separator + TOML_BLOCK);
  return 'added';
}
