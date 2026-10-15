import { type Context, SERVER, SERVER_NAME, SetupError, type State } from './context';
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

export function hasJsonServer(config: JsonObject | undefined, key = 'mcpServers'): boolean {
  const servers = config?.[key];
  return isObject(servers) && SERVER_NAME in servers;
}

export function addJsonServer(ctx: Context, file: string): State {
  const config = readJsonObject(ctx, file) ?? {};
  const servers = config.mcpServers ?? {};
  if (!isObject(servers)) throw new SetupError(`"mcpServers" in ${display(ctx, file)} is not an object. The file was not changed.`);
  if (SERVER_NAME in servers) return 'present';
  const next = { ...config, mcpServers: { ...servers, [SERVER_NAME]: SERVER } };
  writeText(ctx, file, `${JSON.stringify(next, null, 2)}\n`);
  return 'added';
}
