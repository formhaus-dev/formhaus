import { type Context, isOurServer, SERVER, SERVER_NAME, type ServerState, SetupError, type State } from './context';
import { display, readText, writeText } from './files';

type JsonObject = Record<string, unknown>;

function isObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readJsonObject(ctx: Context, file: string): JsonObject | undefined {
  const text = readText(file);
  if (text === undefined || text.trim() === '') return undefined;
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new SetupError(`${display(ctx, file)} is not valid JSON. Fix it and run again. The file was not changed.`);
  }
  if (!isObject(parsed)) throw new SetupError(`${display(ctx, file)} must contain a JSON object. The file was not changed.`);
  return parsed;
}

export function jsonServerState(config: JsonObject | undefined): ServerState {
  const servers = config?.mcpServers;
  if (!isObject(servers) || !(SERVER_NAME in servers)) return 'missing';
  const entry = servers[SERVER_NAME];
  return isObject(entry) && isOurServer(entry.command, entry.args) ? 'present' : 'different';
}

export function addJsonServer(ctx: Context, file: string, root: string): State {
  const config = readJsonObject(ctx, file) ?? {};
  const servers = config.mcpServers ?? {};
  if (!isObject(servers)) throw new SetupError(`"mcpServers" in ${display(ctx, file)} is not an object. The file was not changed.`);
  const existing = jsonServerState({ mcpServers: servers });
  if (existing !== 'missing') return existing;
  const next = { ...config, mcpServers: { ...servers, [SERVER_NAME]: SERVER } };
  writeText(ctx, file, `${JSON.stringify(next, null, 2)}\n`, root);
  return 'added';
}
