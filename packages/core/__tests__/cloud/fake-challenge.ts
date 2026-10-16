import { vi } from 'vitest';
import type { CloudChallenge } from '../../src/cloud';

export const ORIGIN = 'https://formhaus.cc';
export const challenge: CloudChallenge = { provider: 'turnstile', siteKey: '0x4AAA', url: `${ORIGIN}/challenge?form=abc` };

interface FakeFrame {
  src: string;
  title: string;
  tabIndex: number;
  onload: (() => void) | null;
  isConnected: boolean;
  style: { cssText: string };
  attributes: Record<string, string>;
  contentWindow: { postMessage: ReturnType<typeof vi.fn> };
  setAttribute(name: string, value: string): void;
  scrollIntoView: ReturnType<typeof vi.fn>;
  remove(): void;
}

type Listener = (event: { origin: string; source: unknown; data: unknown }) => void;

export function page() {
  const listeners = new Set<Listener>();
  const frames: FakeFrame[] = [];
  const host = {
    ownerDocument: {
      defaultView: {
        addEventListener: (_: 'message', listener: Listener) => listeners.add(listener),
        removeEventListener: (_: 'message', listener: Listener) => listeners.delete(listener),
      },
      createElement: () => {
        const frame: FakeFrame = {
          src: '',
          title: '',
          tabIndex: 0,
          onload: null,
          isConnected: false,
          style: { cssText: '' },
          attributes: {},
          contentWindow: { postMessage: vi.fn() },
          setAttribute(name, value) {
            this.attributes[name] = value;
          },
          scrollIntoView: vi.fn(),
          remove() {
            this.isConnected = false;
          },
        };
        frames.push(frame);
        return frame;
      },
    },
    append: (frame: never) => {
      (frame as FakeFrame).isConnected = true;
    },
  };
  const last = () => frames.at(-1)!;
  const send = (data: unknown, origin = ORIGIN, source: unknown = last().contentWindow) => {
    for (const listener of listeners) listener({ origin, source, data });
  };
  const reply = (fields: Record<string, unknown>) => send({ type: 'formhaus:challenge', formId: 'abc', ...fields });
  return { host, frames, listeners, last, send, reply };
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
