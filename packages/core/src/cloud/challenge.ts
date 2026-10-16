import type { CloudChallenge } from './envelope';
import { CloudError } from './error';

const TIMEOUT = 40_000;

interface ChallengeEvent {
  origin: string;
  source: unknown;
  data: Reply;
}

type Reply = { type?: unknown; formId?: unknown; height?: unknown; token?: unknown; error?: unknown } | null;
type Listener = (event: ChallengeEvent) => void;

interface ChallengeView {
  addEventListener(type: 'message', listener: Listener): void;
  removeEventListener(type: 'message', listener: Listener): void;
}

interface ChallengeElement {
  src: string;
  title: string;
  tabIndex: number;
  onload: (() => void) | null;
  readonly isConnected: boolean;
  readonly style: { cssText: string };
  readonly contentWindow: { postMessage(message: unknown, targetOrigin: string): void } | null;
  setAttribute(name: string, value: string): void;
  scrollIntoView?(options: { block: 'nearest' }): void;
  remove(): void;
}

export interface ChallengeHost {
  readonly ownerDocument: { createElement(tag: 'iframe'): unknown; readonly defaultView: unknown };
  append(node: never): void;
}

export interface CloudChallengeFrame {
  warm(): void;
  token(): Promise<string>;
  dispose(): void;
}

export function createChallengeFrame(
  challenge: CloudChallenge,
  formId: string,
  host: () => ChallengeHost | null,
  timeout = TIMEOUT,
): CloudChallengeFrame {
  const origin = new URL(challenge.url).origin;
  let frame: ChallengeElement | null = null;
  let view: ChallengeView | undefined;
  let loaded: Promise<void>;
  let settle: ((reply: Reply) => void) | undefined;

  const show = (height: number) => {
    const visible = height > 0;
    frame!.style.cssText = visible
      ? `display:block;width:100%;height:${height}px;border:0`
      : 'position:fixed;top:0;width:1px;height:1px;opacity:0;pointer-events:none;border:0';
    frame!.tabIndex = visible ? 0 : -1;
    frame!.setAttribute('aria-hidden', String(!visible));
    if (visible) frame!.scrollIntoView?.({ block: 'nearest' });
  };

  const listen: Listener = ({ origin: from, source, data }) => {
    if (from !== origin || source !== frame?.contentWindow || data?.type !== 'formhaus:challenge' || data.formId !== formId) return;
    if (typeof data.height === 'number') show(data.height);
    else settle?.(data);
  };

  const dispose = () => {
    view?.removeEventListener('message', listen);
    frame?.remove();
  };

  const mount = () => {
    const parent = frame?.isConnected ? null : host();
    if (parent) {
      dispose();
      frame = parent.ownerDocument.createElement('iframe') as ChallengeElement;
      frame.title = 'Bot check';
      loaded = new Promise((resolve) => (frame!.onload = resolve));
      frame.src = challenge.url;
      show(0);
      view = parent.ownerDocument.defaultView as ChallengeView;
      view.addEventListener('message', listen);
      parent.append(frame as never);
    }
    return frame?.isConnected ? frame : null;
  };

  return {
    warm: mount,
    dispose,
    token: () =>
      new Promise((resolve, reject) => {
        const current = mount();
        const done = (reply: Reply) => {
          clearTimeout(timer);
          if (settle === done) settle = undefined;
          if (typeof reply?.token === 'string' && reply.token) resolve(reply.token);
          else reject(new CloudError(0, reply ? 'verification_failed' : 'verification_timeout'));
        };
        const timer = setTimeout(() => done(null), timeout);
        settle = done;
        if (!current) return done(null);
        loaded.then(() => current.contentWindow?.postMessage({ type: 'formhaus:challenge-request', formId, fresh: true }, origin));
      }),
  };
}
