export interface Context {
  home: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
  platform: NodeJS.Platform;
  dryRun: boolean;
}

export type State = 'added' | 'updated' | 'present' | 'failed';

export interface Change {
  agent: string;
  item: string;
  where: string;
  state: State;
  error?: string;
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
