import { createHash } from 'node:crypto';
import {
  chmodSync,
  constants,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
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

function refuseLinks(ctx: Context, file: string, project?: string): void {
  if (project !== undefined) refuseLinkedDirectories(ctx, project, file);
  for (const path of [file, `${file}.bak`, `${file}.tmp`, `${file}.bak.tmp`]) refuseSymlink(ctx, path);
}

export function writeText(ctx: Context, file: string, text: string, project?: string, replaceBackup = false): void {
  const backup = `${file}.bak`;
  const temporary = `${file}.tmp`;
  const backupTemporary = `${backup}.tmp`;
  refuseLinks(ctx, file, project);
  if (ctx.dryRun) return;
  mkdirSync(dirname(file), { recursive: true });
  if (existsSync(file) && replaceBackup) {
    rmSync(backupTemporary, { force: true });
    copyFileSync(file, backupTemporary, constants.COPYFILE_EXCL);
    renameSync(backupTemporary, backup);
  } else if (existsSync(file) && !existsSync(backup)) copyFileSync(file, backup, constants.COPYFILE_EXCL);
  const mode = statSync(file, { throwIfNoEntry: false })?.mode;
  rmSync(temporary, { force: true });
  writeFileSync(temporary, text, { flag: 'wx', mode: mode === undefined ? undefined : mode & 0o600 });
  if (mode !== undefined) chmodSync(temporary, mode & 0o7777);
  renameSync(temporary, file);
}

export function sha256(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function writeAsset(ctx: Context, file: string, text: string, shipped: readonly string[], project?: string): State {
  const current = readText(file);
  if (current === text) return 'present';
  refuseLinks(ctx, file, project);
  if (current === undefined || shipped.includes(sha256(current))) {
    writeText(ctx, file, text, project);
    return current === undefined ? 'added' : 'updated';
  }
  if (!ctx.force) return 'kept';
  writeText(ctx, file, text, project, true);
  return 'replaced';
}

function sameDirectory(a: string, b: string): boolean {
  if (resolve(a) === resolve(b)) return true;
  try {
    return realpathSync(a) === realpathSync(b);
  } catch {
    return false;
  }
}

function isProjectRoot(directory: string): boolean {
  return existsSync(join(directory, '.git')) || existsSync(join(directory, 'package.json')) || isDirectory(join(directory, '.cursor'));
}

export function findProjectRoot(ctx: Context): string | undefined {
  let directory = resolve(ctx.cwd);
  while (!sameDirectory(directory, ctx.home)) {
    if (isProjectRoot(directory)) return directory;
    const parent = dirname(directory);
    if (parent === directory) return undefined;
    directory = parent;
  }
  return undefined;
}

export function display(ctx: Context, path: string): string {
  return path === ctx.home || path.startsWith(ctx.home + sep) ? `~${path.slice(ctx.home.length)}` : path;
}

export function step(ctx: Context, agent: string, item: string, where: string, apply: () => State): Change {
  const target = display(ctx, where);
  const firstBackup = existsSync(where) && !existsSync(`${where}.bak`);
  try {
    const state = apply();
    const backedUp = state === 'replaced' || (firstBackup && !ctx.dryRun && (state === 'added' || state === 'updated'));
    const change: Change = { agent, item, where: backedUp ? `${target} (backup: ${target}.bak)` : target, state };
    if (state === 'kept') change.note = `Run npx formhaus --force to replace it. Your version will be saved as ${target}.bak.`;
    return change;
  } catch (error) {
    return { agent, item, where: target, state: 'failed', note: error instanceof Error ? error.message : String(error) };
  }
}
