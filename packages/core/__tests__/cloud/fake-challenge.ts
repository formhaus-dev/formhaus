import { vi } from 'vitest';
import type { CloudChallenge } from '../../src/cloud';

export const ORIGIN = 'https://formhaus.cc';
export const challenge: CloudChallenge = { provider: 'turnstile', siteKey: '0x4AAA', url: `${ORIGIN}/challenge?form=abc` };

interface FakeNode {
  textContent: string | null;
  isConnected: boolean;
  style: { cssText: string };
  attributes: Record<string, string>;
  setAttribute(name: string, value: string): void;
  remove(): void;
}

interface FakeFrame extends FakeNode {
  src: string;
  title: string;
  tabIndex: number;
  onload: (() => void) | null;
  contentWindow: { postMessage: ReturnType<typeof vi.fn> };
  scrollIntoView: ReturnType<typeof vi.fn>;
}

type Listener = (event: { origin: string; source: unknown; data: unknown }) => void;

function node(): FakeNode {
  return {
    textContent: '',
    isConnected: false,
    style: { cssText: '' },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    remove() {
      this.isConnected = false;
    },
  };
}

export function page() {
  const listeners = new Set<Listener>();
  const frames: FakeFrame[] = [];
  const statuses: FakeNode[] = [];
  const host = {
    ownerDocument: {
      defaultView: {
        addEventListener: (_: 'message', listener: Listener) => listeners.add(listener),
        removeEventListener: (_: 'message', listener: Listener) => listeners.delete(listener),
      },
      createElement: (tag: 'iframe' | 'p') => {
        if (tag === 'p') {
          const status = node();
          statuses.push(status);
          return status;
        }
        const frame: FakeFrame = {
          ...node(),
          src: '',
          title: '',
          tabIndex: 0,
          onload: null,
          contentWindow: { postMessage: vi.fn() },
          scrollIntoView: vi.fn(),
        };
        frames.push(frame);
        return frame;
      },
    },
    append: (...nodes: never[]) => {
      for (const appended of nodes as FakeNode[]) appended.isConnected = true;
    },
  };
  const last = () => frames.at(-1)!;
  const send = (data: unknown, origin = ORIGIN, source: unknown = last().contentWindow) => {
    for (const listener of listeners) listener({ origin, source, data });
  };
  const reply = (fields: Record<string, unknown>) => send({ type: 'formhaus:challenge', formId: 'abc', ...fields });
  const requests = () => last().contentWindow.postMessage.mock.calls.map(([message]) => message as { id: number; fresh: boolean });
  return { host, frames, statuses, listeners, last, send, reply, requests };
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
