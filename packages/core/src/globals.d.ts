declare const console: {
  log(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

interface AbortSignal {
  readonly aborted: boolean;
  addEventListener(type: 'abort', listener: () => void): void;
  removeEventListener(type: 'abort', listener: () => void): void;
}

declare function setTimeout(handler: () => void, timeout: number): unknown;
declare function clearTimeout(id: unknown): void;

declare class AbortController {
  readonly signal: AbortSignal;
  abort(): void;
}

interface CloudResponse {
  readonly ok: boolean;
  readonly status: number;
  readonly headers?: { get(name: string): string | null };
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

declare const process: { env: Record<string, string | undefined> };

declare const __FORMHAUS_CORE_VERSION__: string;

declare class URL {
  constructor(url: string);
  readonly origin: string;
  readonly pathname: string;
}

declare class URLSearchParams {
  constructor(init?: string);
  get(name: string): string | null;
}
