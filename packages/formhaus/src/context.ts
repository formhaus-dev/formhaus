export interface Context {
  home: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  dryRun: boolean;
  force: boolean;
}

export type State = 'added' | 'updated' | 'replaced' | 'present' | 'kept' | 'different' | 'skipped' | 'failed';
export type ServerState = 'missing' | 'present' | 'different';

export interface Change {
  agent: string;
  item: string;
  where: string;
  state: State;
  note?: string;
}

export interface Agent {
  name: string;
  detect(ctx: Context): boolean;
  apply(ctx: Context): Change[];
}

export class SetupError extends Error {}

export const SERVER_NAME = 'formhaus';
export const SERVER_PACKAGE = '@formhaus/mcp';
export const SERVER = { command: 'npx', args: ['-y', SERVER_PACKAGE] };
export const GUIDE_URL = 'https://formhaus.dev/guide/mcp';

export function isOurServer(command: unknown, args: unknown): boolean {
  return (
    command === SERVER.command &&
    Array.isArray(args) &&
    args.length === SERVER.args.length &&
    args.every((arg, index) => arg === SERVER.args[index])
  );
}
