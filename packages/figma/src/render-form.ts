import type { FormDefinition, FormField } from '@formhaus/core';
import { PLUGIN_NAMESPACE } from './config';
import type { KitTheme } from './kits/kit';
import { solid, stack, text } from './kits/primitives';
import { getSteps } from './parse';
import { appendActions, DEFAULT_LAYOUT, stepButtons, type FormLayout, type StepActions } from './render-actions';
import type { FormRenderer } from './renderers/types';

const LEGACY_NAMESPACE = 'formGenerator';
const FRAME_GAP = 40;
export const DEFINITION_KEY = 'definition';
export const LAYOUT_KEY = 'layout';
const MAX_STORED_DEFINITION = 90_000;

interface RenderableStep extends StepActions {
  title: string;
  description?: string;
  fields: FormField[];
}

export async function renderForm(definition: FormDefinition, renderer: FormRenderer, layout: FormLayout = DEFAULT_LAYOUT): Promise<FrameNode[]> {
  const existingFrames = findExistingFrames(definition.id).sort((left, right) => absolute(left, 0) - absolute(right, 0) || absolute(left, 1) - absolute(right, 1));
  const fallbackX = nextFrameX(figma.currentPage.children, existingFrames);
  const createdFrames: FrameNode[] = [];
  try {
    const steps = getSteps(definition) as RenderableStep[];
    const stored = JSON.stringify(definition);
    for (let index = 0; index < steps.length; index++) {
      const frame = await renderStep(definition, steps[index], index, steps.length, renderer, layout);
      place(frame, existingFrames[index] ?? createdFrames[index - 1], Boolean(existingFrames[index]), fallbackX);
      if (utf8Length(stored) <= MAX_STORED_DEFINITION) frame.setSharedPluginData(PLUGIN_NAMESPACE, DEFINITION_KEY, stored);
      frame.setSharedPluginData(PLUGIN_NAMESPACE, LAYOUT_KEY, JSON.stringify(layout));
      createdFrames.push(frame);
    }
    for (const frame of existingFrames) frame.remove();
    return createdFrames;
  } catch (error) {
    for (const frame of createdFrames) frame.remove();
    throw error;
  }
}

function absolute(frame: FrameNode, axis: 0 | 1): number {
  return frame.absoluteTransform[axis][2];
}

function utf8Length(text: string): number {
  return encodeURIComponent(text).replace(/%[0-9A-F]{2}/g, '_').length;
}

function place(frame: FrameNode, anchor: FrameNode | undefined, replaces: boolean, fallbackX: number): void {
  if (!anchor) {
    frame.x = fallbackX;
    frame.y = 0;
    return;
  }
  const parent = anchor.parent as (BaseNode & ChildrenMixin) | null;
  if (parent && parent !== frame.parent) parent.insertChild(parent.children.indexOf(anchor) + 1, frame);
  frame.x = replaces ? anchor.x : anchor.x + anchor.width + FRAME_GAP;
  frame.y = anchor.y;
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
  index: number,
  stepCount: number,
  renderer: FormRenderer,
  layout: FormLayout,
): Promise<FrameNode> {
  const isMultiStep = stepCount > 1;
  const name = isMultiStep ? `${definition.title} — Step ${index + 1}: ${step.title}` : definition.title;
  const frame = createCard(name, definition.id, renderer.theme);
  const { theme } = renderer;
  if (isMultiStep) append(frame, text(`Step ${index + 1} of ${stepCount}`, { font: theme.fonts.regular, size: theme.captionSize, color: theme.muted }, 'Progress'));
  append(frame, text(isMultiStep ? step.title : definition.title, { font: theme.fonts.semibold, size: theme.titleSize, color: theme.text }, 'Title'));
  if (step.description) append(frame, text(step.description, { font: theme.fonts.regular, size: theme.bodySize, color: theme.muted }, 'Description'));
  for (const field of step.fields) append(frame, await renderer.field(field));
  const buttons = stepButtons(definition, step, { isFirst: index === 0, isLast: index === stepCount - 1, isMultiStep });
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

