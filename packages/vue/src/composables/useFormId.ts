import * as vue from 'vue';

const counters = new WeakMap<object, number>();
let client = 0;

export function useFormId(): string {
  const useId = (vue as { useId?: () => string | undefined }).useId;
  const id = useId?.();
  if (id) return id;
  const instance = vue.getCurrentInstance()!;
  if (!instance.vnode.el && !vue.inject(vue.ssrContextKey, null)) return `fh${client++}`;
  const next = counters.get(instance.appContext) ?? 0;
  counters.set(instance.appContext, next + 1);
  return `fhs${next}`;
}
