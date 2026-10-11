import { isVisible, type FormDefinition } from '@formhaus/core';

export function nextStep(definition: FormDefinition, stepId: string, values: Record<string, unknown>): string | undefined {
  const steps = definition.steps ?? [];
  const index = steps.findIndex((step) => step.id === stepId);
  if (index < 0) return undefined;
  const routes = steps[index].routes;
  if (!routes?.length) return steps[index + 1]?.id;
  return routes.find((route) => isVisible(route, values))?.to ?? undefined;
}
