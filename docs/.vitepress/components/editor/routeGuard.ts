import type { Router } from 'vitepress';

type Guard = (to: string) => Promise<boolean | void> | boolean | void;

const guards = new Set<Guard>();
const late = new Set<Guard>();
const installed = new WeakSet<Router>();

export const pathOf = (href: string) => new URL(href, window.location.href).pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';

export function addRouteGuard(router: Router, guard: Guard, after = false): () => void {
  if (!installed.has(router)) {
    installed.add(router);
    const previous = router.onBeforeRouteChange;
    router.onBeforeRouteChange = async (to) => {
      if ((await previous?.(to)) === false) return false;
      for (const each of [...guards, ...late]) if ((await each(to)) === false) return false;
      return undefined;
    };
  }
  const list = after ? late : guards;
  list.add(guard);
  return () => {
    list.delete(guard);
  };
}
