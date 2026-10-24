import type { ValidateContext } from '@formhaus/core';
import type { LibraryId } from './recipes';
import type { Problem, Reply, Request } from './runtime/module';

const timeout = 10000;

export type Outcome = { errors: Record<string, string> } | { problem: Problem };

interface Loaded {
  target?: HTMLIFrameElement;
  problem?: Problem;
}

const page = (scripts: string[]) =>
  `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${location.origin} 'unsafe-eval'">${scripts
    .map((src) => `<script src="${new URL(src, location.href).href}"></script>`)
    .join('')}`;

const changed = { message: 'The schema changed. Run it again.' };
const escaped = { message: 'The schema code left the sandbox. Edit it to load it again.' };

export function createSandbox() {
  let frame: HTMLIFrameElement | undefined;
  let loaded: Promise<Loaded> = Promise.resolve({ problem: { message: 'The schema is still loading' } });
  let last: Parameters<typeof run> | undefined;
  let destroyed = false;
  let next = 0;
  const waiting = new Map<number | 'loaded', (reply: Reply | Problem) => void>();

  function settleAll(problem: Problem) {
    for (const settle of [...waiting.values()]) settle(problem);
  }

  function drop() {
    frame?.remove();
    frame = undefined;
    settleAll(changed);
  }

  function onMessage(event: MessageEvent<Reply | null>) {
    if (!frame || event.source !== frame.contentWindow || !event.data?.type) return;
    waiting.get(event.data.type === 'result' ? event.data.id : 'loaded')?.(event.data);
  }

  function ask(target: HTMLIFrameElement, key: number | 'loaded', request: Request) {
    return new Promise<Reply | Problem>((resolve) => {
      const timer = setTimeout(() => waiting.get(key)?.({ message: `The sandbox did not answer in ${timeout / 1000} seconds` }), timeout);
      waiting.set(key, (reply) => {
        clearTimeout(timer);
        waiting.delete(key);
        resolve(reply);
      });
      target.contentWindow?.postMessage(request, '*');
    });
  }

  async function run(code: string, uses: LibraryId[]): Promise<Problem | undefined> {
    last = [code, uses];
    const { default: urls } = await import('virtual:schema-runtimes');
    if (destroyed) return undefined;
    drop();
    const target = document.createElement('iframe');
    target.setAttribute('sandbox', 'allow-scripts');
    target.style.display = 'none';
    target.srcdoc = page([urls.base, ...uses.map((library) => urls[library])]);
    frame = target;
    let loads = 0;
    const started = new Promise((resolve) =>
      target.addEventListener('load', () => {
        loads += 1;
        if (loads === 1) resolve(undefined);
        else if (frame === target) {
          drop();
          loaded = Promise.resolve({ problem: escaped });
        }
      }),
    );
    document.body.append(target);
    loaded = started
      .then(() => ask(target, 'loaded', { type: 'run', code }))
      .then((reply) => ({ target, problem: 'type' in reply ? (reply.type === 'loaded' ? reply.problem : changed) : reply }));
    return (await loaded).problem;
  }

  async function validate(values: Record<string, unknown>, context: ValidateContext): Promise<Outcome> {
    const { target, problem } = await loaded;
    if (problem) return { problem };
    if (!target || target !== frame) return { problem: changed };
    const id = ++next;
    const plain = JSON.parse(JSON.stringify({ values, context })) as { values: Record<string, unknown>; context: ValidateContext };
    const reply = await ask(target, id, { type: 'validate', id, ...plain });
    if (!('type' in reply)) {
      if (frame === target && last) void run(...last);
      return { problem: reply };
    }
    return reply.type === 'result' && reply.errors
      ? { errors: reply.errors }
      : { problem: (reply.type === 'result' && reply.problem) || changed };
  }

  window.addEventListener('message', onMessage);
  return {
    run,
    validate,
    destroy() {
      destroyed = true;
      window.removeEventListener('message', onMessage);
      drop();
    },
  };
}
