import { accessSync, constants, statSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import type { Context } from './context';

function isExecutable(file: string): boolean {
  try {
    accessSync(file, constants.X_OK);
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

export function findOnPath(ctx: Context, name: string): string | undefined {
  const windows = ctx.platform === 'win32';
  const extensions = windows ? (ctx.env.PATHEXT || '.EXE;.CMD;.BAT').split(';').filter(Boolean) : [''];
  for (const directory of (ctx.env.PATH ?? '').split(windows ? ';' : ':')) {
    if (!isAbsolute(directory)) continue;
    for (const extension of extensions) {
      const candidate = join(directory, name + extension.toLowerCase());
      if (isExecutable(candidate)) return candidate;
    }
  }
  return undefined;
}

export interface Command {
  file: string;
  args: string[];
  verbatim: boolean;
}

export function command(ctx: Context, executable: string, args: string[]): Command {
  if (ctx.platform !== 'win32' || !/\.(cmd|bat)$/i.test(executable)) return { file: executable, args, verbatim: false };
  const shell = ctx.env.ComSpec || join(ctx.env.SystemRoot || 'C:\\Windows', 'System32', 'cmd.exe');
  return { file: shell, args: ['/d', '/s', '/c', `""${executable}" ${args.join(' ')}"`], verbatim: true };
}
