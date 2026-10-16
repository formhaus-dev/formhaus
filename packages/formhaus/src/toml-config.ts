import { type Context, isOurServer, SERVER, SERVER_NAME, type ServerState, SetupError, type State } from './context';
import { display, readText, writeText } from './files';

const NAME = `(?:${SERVER_NAME}|"${SERVER_NAME}"|'${SERVER_NAME}')`;
const PARENT = `(?:mcp_servers|"mcp_servers"|'mcp_servers')`;
const TABLE = new RegExp(`^\\s*\\[\\s*${PARENT}\\s*\\.\\s*${NAME}\\s*[\\].]`, 'm');
const OUR_TABLE = new RegExp(`^\\s*\\[\\s*${PARENT}\\s*\\.\\s*${NAME}\\s*\\]\\s*(?:#.*)?$`, 'm');
const DOTTED_KEY = new RegExp(`^\\s*${PARENT}\\s*\\.\\s*${NAME}\\s*[.=]`, 'm');
const SERVERS_TABLE = new RegExp(`^\\s*\\[\\s*${PARENT}\\s*\\]\\s*(?:#.*)?$`, 'm');
const NEXT_TABLE = /^\s*\[/m;
const INLINE_SERVERS = new RegExp(`^\\s*${PARENT}\\s*=`, 'm');
const SERVER_KEY = new RegExp(`^\\s*${NAME}\\s*[.=]`, 'm');
const PART = String.raw`\s*(?:[A-Za-z0-9_-]+|"(?:[^"\\\n]|\\.)*"|'[^'\n]*')\s*`;
const PATH = String.raw`${PART}(?:\.${PART})*`;
const HEADER = new RegExp(String.raw`^(?:\[\[(${PATH})\]\]|\[(${PATH})\])\s*(?:#.*)?$`);
const ASSIGNMENT = new RegExp(`^(${PATH})=`);
const PARTS = /"(?:[^"\\\n]|\\.)*"|'[^'\n]*'|[A-Za-z0-9_-]+/g;
const TOKEN = /"""|'''|"(?:[^"\\]|\\.)*"|'[^']*'/y;

interface Scan {
  quote?: string;
  depth: number;
}

function parts(path: string): string[] {
  return path.match(PARTS) ?? [];
}

function isEscaped(part: string): boolean {
  return part.startsWith('"') && part.includes('\\');
}

function isServers(part: string | undefined): boolean {
  return part !== undefined && part.replace(/^["']|["']$/g, '') === 'mcp_servers';
}

function isUnsafe(path: string[]): boolean {
  return path.length > 0 && (isEscaped(path[0]) || (isServers(path[0]) && path.some(isEscaped)));
}

function advance(line: string, scan: Scan): void {
  let index = 0;
  while (index < line.length) {
    if (scan.quote !== undefined) {
      if (scan.quote === '"""' && line[index] === '\\') index += 2;
      else if (line.startsWith(scan.quote, index)) {
        index += 3;
        scan.quote = undefined;
      } else index++;
      continue;
    }
    if (line[index] === '#') return;
    TOKEN.lastIndex = index;
    const token = TOKEN.exec(line);
    if (token) {
      if (token[0] === '"""' || token[0] === "'''") scan.quote = token[0];
      index += token[0].length;
      continue;
    }
    if (line[index] === '[' || line[index] === '{') scan.depth++;
    else if ((line[index] === ']' || line[index] === '}') && scan.depth > 0) scan.depth--;
    index++;
  }
}

function hasUnsafeKey(text: string): boolean {
  const scan: Scan = { depth: 0 };
  let table: string[] = [];
  for (const line of text.split('\n')) {
    if (scan.quote === undefined && scan.depth === 0) {
      const trimmed = line.trim();
      if (trimmed.startsWith('[')) {
        const header = HEADER.exec(trimmed);
        if (!header && /mcp|formhaus|\\/.test(trimmed)) return true;
        table = header ? parts(header[1] ?? header[2]) : [];
        if (isUnsafe(table) || (header?.[1] !== undefined && isServers(table[0]))) return true;
      } else {
        const assignment = ASSIGNMENT.exec(line);
        if (assignment && isUnsafe([...table, ...parts(assignment[1])])) return true;
      }
    }
    advance(line, scan);
  }
  return false;
}

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
  if (hasUnsafeKey(text)) {
    throw new SetupError(
      `${display(ctx, file)} has a key Formhaus cannot read safely. Add the formhaus server by hand. The file was not changed.`,
    );
  }
  const separator = text.trim() === '' ? '' : text.endsWith('\n') ? '\n' : '\n\n';
  writeText(ctx, file, text.trim() === '' ? TOML_BLOCK : text + separator + TOML_BLOCK);
  return 'added';
}
