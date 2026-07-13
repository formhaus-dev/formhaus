export interface NotifyOptions {
  fieldKeys?: Iterable<string>;
  structureChanged?: boolean;
}

export class FormSubscriptions {
  private version = 0;
  private listeners = new Set<() => void>();
  private fieldVersions = new Map<string, number>();
  private fieldListeners = new Map<string, Set<() => void>>();
  private structureVersion = 0;
  private structureListeners = new Set<() => void>();

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getSnapshot(): number {
    return this.version;
  }

  subscribeField(key: string, listener: () => void): () => void {
    const listeners = this.fieldListeners.get(key) ?? new Set();
    listeners.add(listener);
    this.fieldListeners.set(key, listeners);
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) this.fieldListeners.delete(key);
    };
  }

  getFieldSnapshot(key: string): number {
    return this.fieldVersions.get(key) ?? 0;
  }

  subscribeStructure(listener: () => void): () => void {
    this.structureListeners.add(listener);
    return () => this.structureListeners.delete(listener);
  }

  getStructureSnapshot(): number {
    return this.structureVersion;
  }

  notify({ fieldKeys = [], structureChanged = false }: NotifyOptions = {}): void {
    for (const key of new Set(fieldKeys)) this.notifyField(key);
    if (structureChanged) this.notifyStructure();

    this.version++;
    for (const listener of this.listeners) listener();
  }

  private notifyField(key: string): void {
    this.fieldVersions.set(key, (this.fieldVersions.get(key) ?? 0) + 1);
    for (const listener of this.fieldListeners.get(key) ?? []) listener();
  }

  private notifyStructure(): void {
    this.structureVersion++;
    for (const listener of this.structureListeners) listener();
  }
}
