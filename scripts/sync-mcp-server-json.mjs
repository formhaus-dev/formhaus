import { readFile, writeFile } from 'node:fs/promises';

const pkgUrl = new URL('../packages/mcp/package.json', import.meta.url);
const serverUrl = new URL('../packages/mcp/server.json', import.meta.url);

const pkg = JSON.parse(await readFile(pkgUrl, 'utf8'));
const server = JSON.parse(await readFile(serverUrl, 'utf8'));

server.name = pkg.mcpName;
server.version = pkg.version;
server.packages = server.packages.map((entry) =>
  entry.identifier === pkg.name ? { ...entry, version: pkg.version } : entry,
);

await writeFile(serverUrl, `${JSON.stringify(server, null, 2)}\n`);
