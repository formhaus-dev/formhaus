export interface NotifyOptions {
  fieldKeys?: Iterable<string>;
  structureChanged?: boolean;
  valuesChanged?: boolean;
}

type Listener = () => void;

function listen(listeners: Set<Listener>, listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function createSubscriptions() {
  let version = 0;
  let structureVersion = 0;
  const listeners = new Set<Listener>();
  const structureListeners = new Set<Listener>();
  const valueListeners = new Set<Listener>();
  const fieldVersions = new Map<string, number>();
  const fieldListeners = new Map<string, Set<Listener>>();

  return {
    subscribe: (listener: Listener) => listen(listeners, listener),
    getSnapshot: () => version,
    subscribeValues: (listener: Listener) => listen(valueListeners, listener),
    subscribeStructure: (listener: Listener) => listen(structureListeners, listener),
    getStructureSnapshot: () => structureVersion,
    getFieldSnapshot: (key: string) => fieldVersions.get(key) ?? 0,

    subscribeField(key: string, listener: Listener): () => void {
      const set = fieldListeners.get(key) ?? new Set();
      set.add(listener);
      fieldListeners.set(key, set);
      return () => {
        set.delete(listener);
        if (set.size === 0) fieldListeners.delete(key);
      };
    },

    notify({ fieldKeys = [], structureChanged = false, valuesChanged = false }: NotifyOptions = {}): void {
      for (const key of new Set(fieldKeys)) {
        fieldVersions.set(key, (fieldVersions.get(key) ?? 0) + 1);
        for (const listener of fieldListeners.get(key) ?? []) listener();
      }
      if (structureChanged) {
        structureVersion++;
        for (const listener of structureListeners) listener();
      }
      version++;
      for (const listener of listeners) listener();
      if (valuesChanged) for (const listener of valueListeners) listener();
    },
  };
}
