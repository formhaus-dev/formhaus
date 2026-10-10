declare const console: {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

interface AbortSignal {
  readonly aborted: boolean;
}

declare class AbortController {
  readonly signal: AbortSignal;
  abort(): void;
}

interface CloudResponse {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

interface CloudRequestInit {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
}

declare const fetch: (url: string, init?: CloudRequestInit) => Promise<CloudResponse>;
declare const crypto: {
  randomUUID?(): string;
  getRandomValues(array: Uint8Array): Uint8Array;
};
