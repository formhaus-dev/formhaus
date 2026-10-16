import { isDeepStrictEqual } from 'node:util';
import { parse } from 'smol-toml';
import { type Context, isOurServer, SERVER, SERVER_NAME, type ServerState, SetupError, type State } from './context';
import { display, readText, writeText } from './files';

type Table = Record<string, unknown>;

const TOML_BLOCK = [
  `[mcp_servers.${SERVER_NAME}]`,
  `command = ${JSON.stringify(SERVER.command)}`,
  `args = [${SERVER.args.map((arg) => JSON.stringify(arg)).join(', ')}]`,
  '',
].join('\n');

function isTable(value: unknown): value is Table {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date);
}

function parseToml(text: string): Table | undefined {
  try {
    return parse(text, { integersAsBigInt: true });
  } catch {
    return undefined;
  }
}

function serverState(config: Table): ServerState {
  const servers = config.mcp_servers;
  if (!isTable(servers) || !(SERVER_NAME in servers)) return 'missing';
  const server = servers[SERVER_NAME];
  return isTable(server) && isOurServer(server.command, server.args) ? 'present' : 'different';
}

function keepsEverythingElse(before: Table, after: Table): boolean {
  const { mcp_servers: servers, ...rest } = after;
  if (!isTable(servers)) return false;
  const { [SERVER_NAME]: server, ...others } = servers;
  const { mcp_servers: previous = {}, ...previousRest } = before;
  return (
    isTable(server) &&
    isDeepStrictEqual({ ...server }, SERVER) &&
    isDeepStrictEqual(others, { ...(previous as Table) }) &&
    isDeepStrictEqual(rest, previousRest)
  );
}

function append(text: string): string {
  if (text.trim() === '') return TOML_BLOCK;
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const separator = text.endsWith('\n') ? eol : eol + eol;
  return text + separator + TOML_BLOCK.replaceAll('\n', eol);
}

export function addTomlServer(ctx: Context, file: string): State {
  const text = readText(file) ?? '';
  const refuse = (reason: string) =>
    new SetupError(`${display(ctx, file)} ${reason}. Add the formhaus server by hand. The file was not changed.`);
  const config = parseToml(text);
  if (config === undefined) throw refuse('is not valid TOML');
  if ('mcp_servers' in config && !isTable(config.mcp_servers)) throw refuse('has an mcp_servers value that is not a table');
  const state = serverState(config);
  if (state !== 'missing') return state;
  const next = append(text);
  const updated = parseToml(next);
  if (updated === undefined || !keepsEverythingElse(config, updated)) throw refuse('defines mcp_servers in a way Formhaus cannot extend');
  writeText(ctx, file, next);
  return 'added';
}
