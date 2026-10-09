import type { FormDefinition, FormField } from '@formhaus/core';
import { PLUGIN_NAMESPACE } from './config';
import type { KitTheme } from './kits/kit';
import { solid, stack, text } from './kits/primitives';
import { getSteps } from './parse';
import type { FormRenderer } from './renderers/types';

const LEGACY_NAMESPACE = 'formGenerator';
const FRAME_GAP = 40;

interface RenderableStep {
  title: string;
  description?: string;
  fields: FormField[];
}

export async function renderForm(definition: FormDefinition, renderer: FormRenderer): Promise<FrameNode[]> {
  const existingFrames = findExistingFrames(definition.id);
  const createdFrames: FrameNode[] = [];
  try {
    const steps = getSteps(definition) as RenderableStep[];
    let cursorX = nextFrameX(figma.currentPage.children, existingFrames);
    for (let index = 0; index < steps.length; index++) {
      const frame = await renderStep(definition, steps[index], index, steps.length, renderer);
      frame.x = cursorX;
      cursorX += frame.width + FRAME_GAP;
      createdFrames.push(frame);
    }
    for (const frame of existingFrames) frame.remove();
    return createdFrames;
  } catch (error) {
    for (const frame of createdFrames) frame.remove();
    throw error;
  }
}

function findExistingFrames(definitionId: string): FrameNode[] {
  return figma.currentPage.children.filter((node): node is FrameNode => (
    node.type === 'FRAME' && (
      node.getSharedPluginData(PLUGIN_NAMESPACE, 'definitionId') === definitionId ||
      node.getSharedPluginData(LEGACY_NAMESPACE, 'definitionId') === definitionId
    )
  ));
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
): Promise<FrameNode> {
  const isMultiStep = stepCount > 1;
  const name = isMultiStep ? `${definition.title} — Step ${index + 1}: ${step.title}` : definition.title;
  const frame = createCard(name, definition.id, renderer.theme);
  const { theme } = renderer;
  if (isMultiStep) append(frame, text(`Step ${index + 1} of ${stepCount}`, { font: theme.fonts.regular, size: theme.captionSize, color: theme.muted }, 'Progress'));
  append(frame, text(isMultiStep ? step.title : definition.title, { font: theme.fonts.semibold, size: theme.titleSize, color: theme.text }, 'Title'));
  if (step.description) append(frame, text(step.description, { font: theme.fonts.regular, size: theme.bodySize, color: theme.muted }, 'Description'));
  for (const field of step.fields) append(frame, await renderer.field(field));
  await appendButtons(frame, definition, renderer, index === 0, index === stepCount - 1, isMultiStep);
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

async function appendButtons(
  frame: FrameNode,
  definition: FormDefinition,
  renderer: FormRenderer,
  isFirst: boolean,
  isLast: boolean,
  isMultiStep: boolean,
): Promise<void> {
  const actions = stack('VERTICAL', 'Actions', { itemSpacing: renderer.theme.actionsGap });
  append(frame, actions);
  append(actions, await renderer.button(isLast ? definition.submit.label : 'Continue', true));
  if (isMultiStep && !isFirst) append(actions, await renderer.button('Back', false));
  if (definition.cancel && isFirst) append(actions, await renderer.button(definition.cancel.label, false));
}
