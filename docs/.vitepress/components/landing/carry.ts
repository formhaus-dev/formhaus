import type { FormDefinition } from '@formhaus/core';
import { useRouter } from 'vitepress';
import { onBeforeUnmount, onMounted } from 'vue';
import { CARRY_KEY } from '../editor/carry';
import { addRouteGuard, pathOf } from '../editor/routeGuard';

export function useCarryToBuild(current: () => FormDefinition | null) {
  const router = useRouter();
  let unguard: (() => void) | null = null;
  onMounted(() => {
    unguard = addRouteGuard(router, (to) => {
      const definition = current();
      if (!definition || pathOf(to) !== '/build') return;
      try {
        sessionStorage.setItem(CARRY_KEY, JSON.stringify(definition));
      } catch {
        return;
      }
    }, true);
  });
  onBeforeUnmount(() => {
    unguard?.();
  });
}
