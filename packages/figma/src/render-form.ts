import type { FormDefinition, FormField, FormStep } from '@formhaus/core';
import { PLUGIN_NAMESPACE } from './config';
import type { KitTheme } from './kits/kit';
import { solid, stack, text } from './kits/primitives';
import { getSteps } from './parse';
import { appendActions, DEFAULT_LAYOUT, stepButtons, type FormLayout, type StepActions } from './render-actions';
import { drawFlow, removeFlow } from './flow/arrows';
import { buildGraph, type FlowGraph } from './flow/graph';
import { flowPositions } from './flow/layout';
import { wirePrototype } from './flow/prototype';
import type { FormRenderer } from './renderers/types';

const LEGACY_NAMESPACE = 'formGenerator';
const FRAME_GAP = 40;
export const DEFINITION_KEY = 'definition';
export const LAYOUT_KEY = 'layout';
export const STEP_KEY = 'stepId';
const MAX_STORED_DEFINITION = 90_000;

interface RenderableStep extends StepActions {
  id?: string;
  title: string;
  description?: string;
  fields: FormField[];
}

interface StepContext {
  index: number;
  number: string;
  progress: string | null;
  isLast: boolean;
}

function contexts(steps: RenderableStep[], graph: FlowGraph | null): StepContext[] {
  return steps.map((step, index) => {
    if (!graph || !step.id) return { index, number: `Step ${index + 1}`, progress: null, isLast: true };
    const exits = graph.edges.filter((edge) => edge.from === step.id);
    const number = `Step ${(graph.branching ? graph.depth.get(step.id) ?? 0 : index) + 1}`;
    return { index, number, progress: graph.branching ? number : `${number} of ${steps.length}`, isLast: exits.every((edge) => edge.to === null) };
  });
}

export function matchFrames(stepIds: (string | undefined)[], frames: FrameNode[]): (FrameNode | undefined)[] {
  const ids = frames.map((frame) => frame.getSharedPluginData(PLUGIN_NAMESPACE, STEP_KEY));
  if (ids.every((id) => !id)) return stepIds.map((_, index) => frames[index]);
  return stepIds.map((id) => (id ? frames[ids.indexOf(id)] : undefined));
}

export async function renderForm(definition: FormDefinition, renderer: FormRenderer, layout: FormLayout = DEFAULT_LAYOUT): Promise<FrameNode[]> {
  const existingFrames = findExistingFrames(definition.id).sort((left, right) => absolute(left, 0) - absolute(right, 0) || absolute(left, 1) - absolute(right, 1));
  const fallbackX = nextFrameX(figma.currentPage.children, existingFrames);
  const createdFrames: FrameNode[] = [];
  const steps = getSteps(definition) as RenderableStep[];
  const graph = steps.length > 1 ? buildGraph(definition) : null;
  try {
    const stepContexts = contexts(steps, graph);
    const stored = JSON.stringify(definition);
    const matched = matchFrames(steps.map((step) => step.id), existingFrames);
    for (let index = 0; index < steps.length; index++) {
      const frame = await renderStep(definition, steps[index], stepContexts[index], steps.length, renderer, layout);
      place(frame, matched[index] ?? createdFrames[index - 1], Boolean(matched[index]), fallbackX, Boolean(graph?.branching));
      frame.setSharedPluginData(PLUGIN_NAMESPACE, STEP_KEY, steps[index].id ?? '');
      if (utf8Length(stored) <= MAX_STORED_DEFINITION) frame.setSharedPluginData(PLUGIN_NAMESPACE, DEFINITION_KEY, stored);
      frame.setSharedPluginData(PLUGIN_NAMESPACE, LAYOUT_KEY, JSON.stringify(layout));
      createdFrames.push(frame);
    }
    for (const frame of existingFrames) frame.remove();
  } catch (error) {
    for (const frame of createdFrames) frame.remove();
    throw error;
  }
  removeFlow(definition.id);
  if (graph?.branching) await arrangeFlow(definition, steps, graph, createdFrames, existingFrames.length === 0 ? { x: fallbackX, y: 0 } : null, renderer);
  if (graph) await wirePrototype(definition, steps as FormStep[], createdFrames);
  return createdFrames;
}

async function arrangeFlow(definition: FormDefinition, steps: RenderableStep[], graph: FlowGraph, frames: FrameNode[], origin: { x: number; y: number } | null, renderer: FormRenderer): Promise<void> {
  const boxes = new Map(steps.map((step, index) => [step.id ?? '', frames[index]]));
  if (origin) {
    const positions = flowPositions([...boxes.keys()], graph, boxes, origin);
    for (const [id, frame] of boxes) Object.assign(frame, positions.get(id));
  }
  await drawFlow(definition.id, graph.edges, boxes, renderer.theme);
}

function absolute(frame: FrameNode, axis: 0 | 1): number {
  return frame.absoluteTransform[axis][2];
}

function utf8Length(text: string): number {
  return encodeURIComponent(text).replace(/%[0-9A-F]{2}/g, '_').length;
}

function place(frame: FrameNode, anchor: FrameNode | undefined, replaces: boolean, fallbackX: number, below: boolean): void {
  if (!anchor) {
    frame.x = fallbackX;
    frame.y = 0;
    return;
  }
  const parent = anchor.parent as (BaseNode & ChildrenMixin) | null;
  if (parent && parent !== frame.parent) parent.insertChild(parent.children.indexOf(anchor) + 1, frame);
  frame.x = replaces || below ? anchor.x : anchor.x + anchor.width + FRAME_GAP;
  frame.y = !replaces && below ? anchor.y + anchor.height + FRAME_GAP : anchor.y;
}

function findExistingFrames(definitionId: string): FrameNode[] {
  return [...new Set([PLUGIN_NAMESPACE, LEGACY_NAMESPACE].flatMap((namespace) => figma.currentPage
    .findAllWithCriteria({ types: ['FRAME'], sharedPluginData: { namespace, keys: ['definitionId'] } })
    .filter((frame) => frame.getSharedPluginData(namespace, 'definitionId') === definitionId)))];
}

export function nextFrameX(
  children: readonly { x: number; width?: number }[],
  exclude: Iterable<{ x: number }>,
): number {
  const excluded = new Set(exclude);
  const rightEdge = children.reduce((maximum, node) => {
    if (excluded.has(node)) return maximum;
    const width = 'width' in node ? node.width ?? 0 : 0;
    return Math.max(maximum, node.x + width);
  }, 0);
  return rightEdge + 100;
}

async function renderStep(
  definition: FormDefinition,
  step: RenderableStep,
  context: StepContext,
  stepCount: number,
  renderer: FormRenderer,
  layout: FormLayout,
): Promise<FrameNode> {
  const isMultiStep = stepCount > 1;
  const { index } = context;
  const name = isMultiStep ? `${definition.title} — ${context.number}: ${step.title}` : definition.title;
  const frame = createCard(name, definition.id, renderer.theme);
  const { theme } = renderer;
  if (context.progress) append(frame, text(context.progress, { font: theme.fonts.regular, size: theme.captionSize, color: theme.muted }, 'Progress'));
  append(frame, text(isMultiStep ? step.title : definition.title, { font: theme.fonts.semibold, size: theme.titleSize, color: theme.text }, 'Title'));
  if (step.description) append(frame, text(step.description, { font: theme.fonts.regular, size: theme.bodySize, color: theme.muted }, 'Description'));
  for (const field of step.fields) append(frame, await renderer.field(field));
  const buttons = stepButtons(definition, step, { isFirst: index === 0, isLast: context.isLast, isMultiStep });
  await appendActions(frame, buttons, renderer, layout, append);
  return frame;
}

function append(frame: FrameNode, node: SceneNode | null): void {
  if (!node) return;
  frame.appendChild(node);
  if ('layoutSizingHorizontal' in node) node.layoutSizingHorizontal = 'FILL';
  if (node.type === 'TEXT') node.textAutoResize = 'HEIGHT';
}

function createCard(name: string, definitionId: string, theme: KitTheme): FrameNode {
  const frame = stack('VERTICAL', name, { itemSpacing: theme.card.gap });
  frame.paddingTop = theme.card.padding;
  frame.paddingBottom = theme.card.padding;
  frame.paddingLeft = theme.card.padding;
  frame.paddingRight = theme.card.padding;
  frame.resize(theme.card.width, frame.height);
  frame.counterAxisSizingMode = 'FIXED';
  frame.fills = solid(theme.card.fill);
  frame.cornerRadius = theme.card.radius;
  frame.setSharedPluginData(PLUGIN_NAMESPACE, 'definitionId', definitionId);
  return frame;
}

