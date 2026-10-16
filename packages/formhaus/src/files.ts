import {
  chmodSync,
  constants,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { type Change, type Context, SetupError, type State } from './context';

export function readText(file: string): string | undefined {
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}

export function isDirectory(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory();
}

function refuseSymlink(ctx: Context, path: string): void {
  if (lstatSync(path, { throwIfNoEntry: false })?.isSymbolicLink()) {
    throw new SetupError(`${display(ctx, path)} is a symbolic link. Formhaus does not write through links. Edit the file by hand.`);
  }
}

function isInside(parent: string, path: string): boolean {
  const between = relative(parent, path);
  return between !== '' && !between.startsWith('..') && !isAbsolute(between);
}

function refuseLinkedDirectories(ctx: Context, root: string, file: string): void {
  if (!isInside(root, file)) throw new SetupError(`${display(ctx, file)} is outside ${display(ctx, root)}. Edit the file by hand.`);
  const parts = relative(root, dirname(file)).split(sep).filter(Boolean);
  for (let index = 1; index <= parts.length; index++) refuseSymlink(ctx, resolve(root, ...parts.slice(0, index)));
}

export function writeText(ctx: Context, file: string, text: string, project?: string): void {
  const backup = `${file}.bak`;
  const temporary = `${file}.tmp`;
  if (project !== undefined) refuseLinkedDirectories(ctx, project, file);
  for (const path of [file, backup, temporary]) refuseSymlink(ctx, path);
  if (ctx.dryRun) return;
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file) && !existsSync(backup)) copyFileSync(file, backup, constants.COPYFILE_EXCL);
  const mode = statSync(file, { throwIfNoEntry: false })?.mode;
  rmSync(temporary, { force: true });
  writeFileSync(temporary, text, { flag: 'wx', mode: mode === undefined ? undefined : mode & 0o600 });
  if (mode !== undefined) chmodSync(temporary, mode & 0o7777);
  renameSync(temporary, file);
}

export function writeIfChanged(ctx: Context, file: string, text: string, project?: string): State {
  const current = readText(file);
  if (current === text) return 'present';
  writeText(ctx, file, text, project);
  return current === undefined ? 'added' : 'updated';
}

export function display(ctx: Context, path: string): string {
  return path.startsWith(ctx.home + sep) ? `~${path.slice(ctx.home.length)}` : path;
}

export function step(ctx: Context, agent: string, item: string, where: string, apply: () => State): Change {
  const target = display(ctx, where);
  const firstBackup = existsSync(where) && !existsSync(`${where}.bak`);
  try {
    const state = apply();
    const backedUp = firstBackup && !ctx.dryRun && (state === 'added' || state === 'updated');
    return { agent, item, where: backedUp ? `${target} (backup: ${target}.bak)` : target, state };
  } catch (error) {
    return { agent, item, where: target, state: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}
