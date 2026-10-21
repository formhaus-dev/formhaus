import * as vue from 'vue';
import { clientRender } from './useMounted';

const counters = new WeakMap<object, number>();
let client = 0;

export function useFormId(): string {
  const useId = (vue as { useId?: () => string | undefined }).useId;
  const id = useId?.();
  if (id) return id;
  if (clientRender()) return `fh${client++}`;
  const app = vue.getCurrentInstance()!.appContext;
  const next = counters.get(app) ?? 0;
  counters.set(app, next + 1);
  return `${(app.config as { idPrefix?: string }).idPrefix ?? 'fhs'}${next}`;
}
