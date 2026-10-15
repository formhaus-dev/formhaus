import { accessSync, constants, copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { delimiter, dirname, join, sep } from 'node:path';
import type { Change, Context, State } from './context';

export function readText(file: string): string | undefined {
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

export function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

export function writeText(ctx: Context, file: string, text: string): void {
  if (ctx.dryRun) return;
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file)) copyFileSync(file, `${file}.bak`);
  writeFileSync(file, text);
}

export function writeIfChanged(ctx: Context, file: string, text: string): State {
  const current = readText(file);
  if (current === text) return 'present';
  writeText(ctx, file, text);
  return current === undefined ? 'added' : 'updated';
}

export function findOnPath(ctx: Context, name: string): string | undefined {
  const extensions = ctx.platform === 'win32' ? (ctx.env.PATHEXT ?? '.EXE;.CMD;.BAT').split(';') : [''];
  for (const directory of (ctx.env.PATH ?? '').split(delimiter)) {
    if (!directory) continue;
    for (const extension of extensions) {
      const candidate = join(directory, name + extension.toLowerCase());
      if (isExecutable(candidate)) return candidate;
    }
  }
  return undefined;
}

function isExecutable(file: string): boolean {
  try {
    accessSync(file, constants.X_OK);
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

export function display(ctx: Context, path: string): string {
  return path.startsWith(ctx.home + sep) ? `~${path.slice(ctx.home.length)}` : path;
}

export function step(ctx: Context, agent: string, item: string, where: string, apply: () => State): Change {
  const target = display(ctx, where);
  const existed = existsSync(where);
  try {
    const state = apply();
    const backedUp = existed && !ctx.dryRun && (state === 'added' || state === 'updated');
    return { agent, item, where: backedUp ? `${target} (backup: ${target}.bak)` : target, state };
  } catch (error) {
    return { agent, item, where: target, state: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}
