import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { main } from '../src/main';

export interface Sandbox {
  home: string;
  bin: string;
  cwd: string;
  platform: NodeJS.Platform;
  tty: boolean;
  env: NodeJS.ProcessEnv;
  path(...parts: string[]): string;
  write(relative: string, text: string): void;
  read(relative: string): string;
  exists(relative: string): boolean;
  fakeBin(name: string, exitCode?: number): void;
  claudeCalls(): string[];
  run(...argv: string[]): { code: number; out: string; err: string; text: string };
  cleanup(): void;
}

export const onWindows = process.platform === 'win32';

export function sandbox(): Sandbox {
  const home = mkdtempSync(join(tmpdir(), 'formhaus-cli-'));
  const bin = join(home, 'bin');
  const log = join(home, 'calls.log');
  mkdirSync(bin);
  const path = (...parts: string[]) => join(home, ...parts);
  const box: Sandbox = {
    home,
    bin,
    cwd: home,
    platform: 'linux',
    tty: false,
    env: { PATH: bin, HOME: home },
    path,
    write(relative, text) {
      mkdirSync(dirname(path(relative)), { recursive: true });
      writeFileSync(path(relative), text);
    },
    read: (relative) => readFileSync(path(relative), 'utf8'),
    exists: (relative) => existsSync(path(relative)),
    fakeBin(name, exitCode = 0) {
      const script = join(bin, name);
      writeFileSync(script, `#!/bin/sh\necho "${name} $*" >> "${log}"\necho "${name} said no" >&2\nexit ${exitCode}\n`);
      chmodSync(script, 0o755);
    },
    claudeCalls: () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []),
    run(...argv) {
      const out: string[] = [];
      const err: string[] = [];
      const code = main(
        argv,
        { home: box.home, cwd: box.cwd, env: box.env, platform: box.platform, tty: box.tty },
        (line) => out.push(line),
        (line) => err.push(line),
      );
      return { code, out: out.join('\n'), err: err.join('\n'), text: out.join('\n').replace(/\s+/g, ' ') };
    },
    cleanup: () => rmSync(home, { recursive: true, force: true }),
  };
  return box;
}
