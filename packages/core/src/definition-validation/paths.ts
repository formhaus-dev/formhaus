import type { FormStep, StepRoute } from '../types';

const conditional = (source: Pick<StepRoute, 'show' | 'showAny'>) => !!(source.show?.length || source.showAny?.length);

function successors(steps: FormStep[], indexes: Map<string, number>, from: number): number[] {
  const next: number[] = [];
  for (const route of steps[from].routes ?? []) {
    const target = route.to === null ? null : indexes.get(route.to);
    if (target === null && !conditional(route)) return next;
    if (target === null || target === undefined || target <= from) continue;
    next.push(target);
    if (!conditional(route) && !conditional(steps[target])) return next;
  }
  return from + 1 < steps.length ? [...next, from + 1] : next;
}

export function reachableSteps(steps: FormStep[]): Set<number>[] {
  const indexes = new Map(steps.map((step, index) => [step.id, index]));
  return steps.map((_, start) => {
    const seen = new Set<number>();
    const queue = successors(steps, indexes, start);
    while (queue.length) {
      const index = queue.pop()!;
      if (seen.has(index)) continue;
      seen.add(index);
      queue.push(...successors(steps, indexes, index));
      if (conditional(steps[index]) && index + 1 < steps.length) queue.push(index + 1);
    }
    return seen;
  });
}
