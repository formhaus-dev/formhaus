import type { CloudChallenge } from './envelope';
import { CloudError } from './error';

const TIMEOUT = 40_000;
const QUIET = 10_000;
const HIDDEN = 'position:fixed;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\]|.+\.localhost)$/;

type Reply =
  | {
      type?: unknown;
      formId?: unknown;
      id?: unknown;
      height?: unknown;
      token?: unknown;
      error?: unknown;
      code?: unknown;
    }
  | null
  | undefined;

interface ChallengeEvent {
  origin: string;
  source: unknown;
  data: Reply;
}

type Listener = (event: ChallengeEvent) => void;

interface ChallengeView {
  addEventListener(type: 'message', listener: Listener): void;
  removeEventListener(type: 'message', listener: Listener): void;
}

interface ChallengeNode {
  textContent: string | null;
  readonly isConnected: boolean;
  readonly style: { cssText: string };
  setAttribute(name: string, value: string): void;
  remove(): void;
}

interface ChallengeElement extends ChallengeNode {
  src: string;
  title: string;
  tabIndex: number;
  onload: (() => void) | null;
  readonly contentWindow: { postMessage(message: unknown, targetOrigin: string): void } | null;
  scrollIntoView?(options: { block: 'nearest' }): void;
}

export interface ChallengeHost {
  readonly ownerDocument: { createElement(tag: 'iframe' | 'p'): unknown; readonly defaultView: unknown };
  append(...nodes: never[]): void;
}

export interface CloudChallengeFrame {
  warm(): void;
  token(): Promise<string | undefined>;
  spend(): void;
  dispose(): void;
}

function challengeOrigin(url: string): string | undefined {
  try {
    const { protocol, hostname, origin } = new URL(url);
    return protocol === 'https:' || (protocol === 'http:' && LOCAL.test(hostname)) ? origin : undefined;
  } catch {
    return undefined;
  }
}

export interface ChallengeFrameOptions {
  challenge: CloudChallenge;
  formId: string;
  host: () => ChallengeHost | null;
  timeout?: number;
  quiet?: number;
}

export function createChallengeFrame({
  challenge,
  formId,
  host,
  timeout = TIMEOUT,
  quiet = QUIET,
}: ChallengeFrameOptions): CloudChallengeFrame {
  const origin = challengeOrigin(challenge.url);
  let frame: ChallengeElement | undefined;
  let status: ChallengeNode | undefined;
  let view: ChallengeView | undefined;
  let loaded: Promise<void>;
  let settle: ((reply: Reply) => void) | undefined;
  let request = 0;
  let spent = true;
  let unavailable = !origin;

  const show = (height: number) => {
    const visible = height > 0;
    frame!.style.cssText = visible ? `display:block;width:100%;height:${height}px;border:0;color-scheme:normal` : HIDDEN;
    frame!.tabIndex = visible ? 0 : -1;
    frame!.setAttribute('aria-hidden', String(!visible));
    status!.textContent = visible ? 'Complete the bot check to submit the form.' : '';
    if (visible) frame!.scrollIntoView?.({ block: 'nearest' });
  };

  const listen: Listener = ({ origin: from, source, data }) => {
    if (from !== origin || source !== frame?.contentWindow || data?.type !== 'formhaus:challenge' || data.formId !== formId) return;
    if (data.id !== undefined && data.id !== request) return;
    if (typeof data.height === 'number') show(data.height);
    settle?.(data);
  };

  const detach = () => {
    view?.removeEventListener('message', listen);
    frame?.remove();
    status?.remove();
  };

  const mount = () => {
    const parent = frame?.isConnected ? null : host();
    if (parent && origin) {
      detach();
      const document = parent.ownerDocument;
      status = document.createElement('p') as ChallengeNode;
      status.setAttribute('role', 'status');
      status.style.cssText = HIDDEN;
      frame = document.createElement('iframe') as ChallengeElement;
      frame.title = 'Bot check';
      loaded = new Promise((resolve) => (frame!.onload = resolve));
      frame.src = challenge.url;
      show(0);
      view = document.defaultView as ChallengeView;
      view.addEventListener('message', listen);
      parent.append(frame as never, status as never);
      spent = true;
    }
    return frame?.isConnected ? frame : null;
  };

  return {
    warm: mount,
    spend: () => {
      spent = true;
    },
    dispose: () => {
      settle?.(null);
      detach();
    },
    token: () =>
      new Promise((resolve, reject) => {
        settle?.(null);
        const current = unavailable ? null : mount();
        const done = (reply: Reply) => {
          clearTimeout(silence);
          if (typeof reply?.height === 'number') return;
          clearTimeout(timer);
          if (settle === done) settle = undefined;
          if (typeof reply?.token === 'string' && reply.token) {
            spent = false;
            return resolve(reply.token);
          }
          spent = true;
          if (reply === undefined || reply?.code === 'unavailable' || /load/.test(String(reply?.error))) {
            unavailable = true;
            return resolve(undefined);
          }
          reject(new CloudError({ status: 0, code: reply ? 'verification_failed' : 'verification_timeout' }));
        };
        const timer = setTimeout(() => done(null), timeout);
        const silence = setTimeout(() => done(undefined), quiet);
        settle = done;
        if (!current) return done(undefined);
        const message = { type: 'formhaus:challenge-request', formId, id: ++request, fresh: spent };
        loaded.then(() => settle === done && current.contentWindow?.postMessage(message, origin!));
      }),
  };
}
