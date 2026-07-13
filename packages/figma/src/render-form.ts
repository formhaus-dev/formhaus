import type { FormDefinition, FormField } from '@formhaus/core';
import {
  CARD_GAP,
  CARD_INNER_WIDTH,
  CARD_PADDING,
  CARD_WIDTH,
  getButtonKey,
  getFormsConstructorKey,
} from './constants';
import { createButtonInstance } from './figma-helpers';
import { getSteps } from './parse';
import { renderField } from './render-field';

interface RenderableStep {
  title: string;
  description?: string;
  fields: FormField[];
}

export async function renderForm(definition: FormDefinition): Promise<FrameNode[]> {
  const existingFrames = findExistingFrames(definition.id);
  const createdFrames: FrameNode[] = [];
  try {
    const [fieldsComponentSet, buttonComponentSet] = await loadResources();
    const steps = getSteps(definition) as RenderableStep[];
    let cursorX = nextFrameX(figma.currentPage.children, existingFrames);
    for (let index = 0; index < steps.length; index++) {
      const frame = await renderStep(
        definition,
        steps[index],
        index,
        steps.length,
        fieldsComponentSet,
        buttonComponentSet,
      );
      frame.x = cursorX;
      cursorX += CARD_WIDTH + CARD_GAP;
      createdFrames.push(frame);
    }
    for (const frame of existingFrames) frame.remove();
    return createdFrames;
  } catch (error) {
    for (const frame of createdFrames) frame.remove();
    throw error;
  }
}

async function loadResources(): Promise<[ComponentSetNode, ComponentSetNode]> {
  const [fields, buttons] = await Promise.all([
    figma.importComponentSetByKeyAsync(getFormsConstructorKey()),
    figma.importComponentSetByKeyAsync(getButtonKey()),
    figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' }),
    figma.loadFontAsync({ family: 'Inter', style: 'Regular' }),
  ]);
  return [fields, buttons];
}

function findExistingFrames(definitionId: string): FrameNode[] {
  return figma.currentPage.children.filter((node): node is FrameNode => (
    node.type === 'FRAME' &&
    node.getSharedPluginData('formGenerator', 'definitionId') === definitionId
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
  fieldsComponentSet: ComponentSetNode,
  buttonComponentSet: ComponentSetNode,
): Promise<FrameNode> {
  const isMultiStep = stepCount > 1;
  const frameName = isMultiStep
    ? `${definition.title} — Step ${index + 1}: ${step.title}`
    : definition.title;
  const frame = createCardFrame(frameName, definition.id);
  appendStepHeading(frame, definition, step, index, stepCount);
  await appendFields(frame, step.fields, fieldsComponentSet);
  await appendButtons(
    frame,
    buttonComponentSet,
    definition,
    index === 0,
    index === stepCount - 1,
    isMultiStep,
  );
  return frame;
}

function appendStepHeading(
  frame: FrameNode,
  definition: FormDefinition,
  step: RenderableStep,
  index: number,
  stepCount: number,
): void {
  if (stepCount > 1) {
    appendText(frame, `Step ${index + 1} of ${stepCount}`, 12, 'Regular', true);
  }
  appendText(frame, stepCount > 1 ? step.title : definition.title, 24, 'Semi Bold');
  if (step.description) appendText(frame, step.description, 14, 'Regular', true);
}

function appendText(
  frame: FrameNode,
  characters: string,
  fontSize: number,
  style: 'Regular' | 'Semi Bold',
  muted = false,
): void {
  const text = figma.createText();
  text.fontName = { family: 'Inter', style };
  text.fontSize = fontSize;
  text.characters = characters;
  if (muted) text.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
  frame.appendChild(text);
  text.layoutSizingHorizontal = 'FILL';
}

async function appendFields(
  frame: FrameNode,
  fields: FormField[],
  componentSet: ComponentSetNode,
): Promise<void> {
  for (const field of fields) {
    const node = await renderField(field, componentSet);
    if (!node) continue;
    frame.appendChild(node);
    if ('layoutSizingHorizontal' in node) node.layoutSizingHorizontal = 'FILL';
  }
}

function createCardFrame(name: string, definitionId: string): FrameNode {
  const frame = figma.createFrame();
  frame.name = name;
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'FIXED';
  frame.resize(CARD_WIDTH, 100);
  frame.itemSpacing = 16;
  frame.paddingTop = CARD_PADDING;
  frame.paddingBottom = CARD_PADDING;
  frame.paddingLeft = CARD_PADDING;
  frame.paddingRight = CARD_PADDING;
  frame.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 } }];
  frame.cornerRadius = 12;
  frame.setSharedPluginData('formGenerator', 'definitionId', definitionId);
  return frame;
}

async function appendButtons(
  frame: FrameNode,
  components: ComponentSetNode,
  definition: FormDefinition,
  isFirst: boolean,
  isLast: boolean,
  isMultiStep: boolean,
): Promise<void> {
  await appendButton(frame, components, isLast ? definition.submit.label : 'Continue', 'Primary');
  if (isMultiStep && !isFirst) await appendButton(frame, components, 'Back', 'Secondary');
  if (definition.cancel && isFirst) {
    await appendButton(frame, components, definition.cancel.label, 'Secondary');
  }
}

async function appendButton(
  frame: FrameNode,
  components: ComponentSetNode,
  label: string,
  type: 'Primary' | 'Secondary',
): Promise<void> {
  const button = await createButtonInstance(components, label, type);
  if (!button) return;
  button.resize(CARD_INNER_WIDTH, button.height);
  frame.appendChild(button);
}
