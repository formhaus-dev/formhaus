import { isStepVisible, isVisible, type FormDefinition, type FormStep } from '@formhaus/core';
import { PLUGIN_NAMESPACE } from '../config';
import { ACTION_KEY, type ButtonAction } from '../render-actions';

const TRANSITION: Transition = { type: 'DISSOLVE', easing: { type: 'EASE_OUT' }, duration: 0.2 };
const FORWARD: ButtonAction[] = ['next', 'skip'];

export function routeTarget(steps: FormStep[], index: number, values: Record<string, unknown>): string | null {
  const visibleAfter = (target: number) => target > index && isStepVisible(steps[target], values);
  const route = steps[index].routes?.find((candidate) => isVisible(candidate, values)
    && (candidate.to === null || visibleAfter(steps.findIndex((other) => other.id === candidate.to))));
  if (route) return route.to;
  return steps.find((_, target) => visibleAfter(target))?.id ?? null;
}

export function optionTargets(steps: FormStep[], index: number): Map<string, Map<string, string | null>> {
  const step = steps[index];
  const routed = new Set((step.routes ?? []).flatMap((route) => [...(route.show ?? []), ...(route.showAny ?? [])].map((condition) => condition.field)));
  const result = new Map<string, Map<string, string | null>>();
  for (const field of step.fields) {
    if (field.type !== 'radio' || !(routed.has(field.key) || field.autoAdvance) || !field.options?.length) continue;
    result.set(field.key, new Map(field.options.map((option) => [option.value, routeTarget(steps, index, { [field.key]: option.value })])));
  }
  return result;
}

function click(actions: Action[]): Reaction {
  return { trigger: { type: 'ON_CLICK' }, actions };
}

function navigate(target: FrameNode | undefined): Reaction[] {
  return target ? [click([{ type: 'NODE', destinationId: target.id, navigation: 'NAVIGATE', transition: TRANSITION, resetScrollPosition: true }])] : [];
}

async function wireStep(steps: FormStep[], index: number, frame: FrameNode, frames: Map<string, FrameNode>): Promise<void> {
  const forward = navigate(frames.get(routeTarget(steps, index, {}) ?? ''));
  for (const node of frame.findAll((child) => Boolean(child.getSharedPluginData(PLUGIN_NAMESPACE, ACTION_KEY)))) {
    const action = node.getSharedPluginData(PLUGIN_NAMESPACE, ACTION_KEY) as ButtonAction;
    if ('setReactionsAsync' in node) await node.setReactionsAsync(FORWARD.includes(action) ? forward : action === 'back' ? [click([{ type: 'BACK' }])] : []);
  }
  for (const [key, targets] of optionTargets(steps, index)) {
    const group = frame.findChild((child) => child.name === key);
    const options = group && 'findAll' in group ? group.findAll((child) => child.type === 'INSTANCE' && targets.has(child.name)) : [];
    for (const option of options) if (option.type === 'INSTANCE') await option.setReactionsAsync(navigate(frames.get(targets.get(option.name) ?? '')));
  }
}

export async function wirePrototype(definition: FormDefinition, source: FormStep[], frames: FrameNode[]): Promise<void> {
  const steps = source.map((step, index) => ({ ...step, id: step.id ?? `#${index}` }));
  const byId = new Map(steps.map((step, index) => [step.id, frames[index]]));
  for (let index = 0; index < steps.length; index++) await wireStep(steps, index, frames[index], byId);
  const kept = await livePoints(new Set(frames.map((frame) => frame.id)));
  figma.currentPage.flowStartingPoints = [...kept, { nodeId: frames[0].id, name: definition.title }];
}

export async function livePoints(exclude: Set<string>): Promise<{ nodeId: string; name: string }[]> {
  const points = await Promise.all(figma.currentPage.flowStartingPoints.map(async (point) => ({ point, node: await figma.getNodeByIdAsync(point.nodeId) })));
  return points.filter(({ point, node }) => node && !node.removed && !exclude.has(point.nodeId)).map(({ point }) => point);
}
