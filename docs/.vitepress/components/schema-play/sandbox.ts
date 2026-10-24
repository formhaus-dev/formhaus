import type { ValidateContext } from '@formhaus/core';
import type { LibraryId } from './recipes';
import type { Problem, Reply, Request } from './runtime/module';

const timeout = 10000;

export type Outcome = { errors: Record<string, string> } | { problem: Problem };

const page = (scripts: string[]) =>
  `<!doctype html><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${location.origin} 'unsafe-eval'">${scripts
    .map((src) => `<script src="${new URL(src, location.href).href}"></script>`)
    .join('')}`;

export function createSandbox() {
  let frame: HTMLIFrameElement | undefined;
  let loaded: Promise<Problem | undefined> = Promise.resolve({ message: 'The schema is still loading' });
  let next = 0;
  const waiting = new Map<number | 'loaded', (reply?: Reply) => void>();

  function onMessage(event: MessageEvent<Reply>) {
    if (!frame || event.source !== frame.contentWindow) return;
    const key = event.data.type === 'result' ? event.data.id : 'loaded';
    waiting.get(key)?.(event.data);
  }

  function ask(target: HTMLIFrameElement, key: number | 'loaded', request: Request) {
    return new Promise<Reply | undefined>((resolve) => {
      const timer = setTimeout(() => waiting.get(key)?.(), timeout);
      waiting.set(key, (reply) => {
        clearTimeout(timer);
        waiting.delete(key);
        resolve(reply);
      });
      target.contentWindow?.postMessage(request, '*');
    });
  }

  async function run(code: string, uses: LibraryId[]): Promise<Problem | undefined> {
    const { default: urls } = await import('virtual:schema-runtimes');
    frame?.remove();
    for (const settle of [...waiting.values()]) settle();
    const target = document.createElement('iframe');
    target.setAttribute('sandbox', 'allow-scripts');
    target.style.display = 'none';
    target.srcdoc = page([urls.base, ...uses.map((library) => urls[library])]);
    frame = target;
    const started = new Promise((resolve) => target.addEventListener('load', resolve, { once: true }));
    document.body.append(target);
    loaded = started
      .then(() => ask(target, 'loaded', { type: 'run', code }))
      .then((reply) => (reply?.type === 'loaded' ? reply.problem : { message: 'The sandbox did not start' }));
    return loaded;
  }

  async function validate(values: Record<string, unknown>, context: ValidateContext): Promise<Outcome> {
    const problem = await loaded;
    if (problem) return { problem };
    const id = ++next;
    const plain = JSON.parse(JSON.stringify({ values, context })) as { values: Record<string, unknown>; context: ValidateContext };
    const reply = frame && (await ask(frame, id, { type: 'validate', id, ...plain }));
    if (reply?.type === 'result' && reply.errors) return { errors: reply.errors };
    return {
      problem: (reply?.type === 'result' && reply.problem) || { message: `onValidate did not answer in ${timeout / 1000} seconds` },
    };
  }

  window.addEventListener('message', onMessage);
  return {
    run,
    validate,
    destroy() {
      window.removeEventListener('message', onMessage);
      frame?.remove();
    },
  };
}
