import * as vue from 'vue';

const counters = new WeakMap<object, number>();
let client = 0;

export function useFormId(): string {
  const useId = (vue as { useId?: () => string | undefined }).useId;
  const id = useId?.();
  if (id) return id;
  const instance = vue.getCurrentInstance()!;
  if (!instance.vnode.el && !vue.inject(vue.ssrContextKey, null)) return `fh${client++}`;
  const app = instance.appContext;
  const next = counters.get(app) ?? 0;
  counters.set(app, next + 1);
  return `${(app.config as { idPrefix?: string }).idPrefix ?? 'fhs'}${next}`;
}
