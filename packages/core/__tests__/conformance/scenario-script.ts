import type { Reply } from './scenario-format';

export class Script {
  private readonly deferred = new Map<string, () => void>();

  reply(entries: Reply[] | undefined, fallback?: unknown): unknown {
    const entry = entries?.shift();
    if (!entry) return fallback;
    const settle = () => {
      if (entry.throw !== undefined) throw new Error(entry.throw);
      return entry.return;
    };
    if (!entry.defer) return settle();
    return new Promise((resolve, reject) => {
      this.deferred.set(entry.defer!, () => {
        try {
          resolve(settle());
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  resolve(name: string): void {
    const release = this.deferred.get(name);
    if (!release) throw new Error(`No pending deferred reply "${name}"`);
    this.deferred.delete(name);
    release();
  }

  get pending(): string[] {
    return [...this.deferred.keys()];
  }
}

export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
