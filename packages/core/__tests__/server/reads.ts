const isIndex = (key: string | symbol) => typeof key === 'string' && /^\d+$/.test(key);

export function countReads<T>(items: T[]) {
  let reads = 0;
  const watch = <V extends object>(target: V, counts: (key: string | symbol) => boolean) =>
    new Proxy(target, {
      get(inner, key, receiver) {
        if (counts(key)) reads++;
        return Reflect.get(inner, key, receiver);
      },
    });
  return {
    list: watch(items, isIndex),
    entries: () => items.map((item) => watch(item as object, () => true) as T),
    reads: () => reads,
  };
}
