import { shallowRef, watch } from 'vue';
import type { FormDefinition } from '@formhaus/core';
import { useNear } from './near';

export function useDemoCore(section: string) {
  const core = shallowRef<typeof import('./demo-core')>();
  const near = useNear(() => document.getElementById(`${section}-title`)?.closest('section') ?? null);
  watch(near, async () => { core.value = await (await import('./demo-lazy')).loadDemoCore(); });
  function validate(value: FormDefinition): string[] {
    if (!core.value) return [];
    try {
      return core.value.checkDefinition(value).filter((issue) => issue.severity === 'error').map((issue) => issue.message);
    } catch (error) {
      return [error instanceof Error ? error.message : 'Invalid definition'];
    }
  }
  return { core, near, validate };
}
