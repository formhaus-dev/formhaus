import type { FormAction, FormDefinition } from '@formhaus/core';
import { PLUGIN_NAMESPACE } from './config';
import { stack } from './kits/primitives';
import type { FormRenderer } from './renderers/types';
import type { ButtonKind } from './roles';

export type ActionsLayout = 'stacked' | 'inline';

export interface FormLayout {
  actions: ActionsLayout;
}

export const DEFAULT_LAYOUT: FormLayout = { actions: 'stacked' };

export interface StepActions {
  next?: FormAction | false;
  back?: FormAction | false;
  skip?: FormAction;
}

export type ButtonAction = 'next' | 'submit' | 'back' | 'skip' | 'cancel';

export const ACTION_KEY = 'action';

export interface PlannedButton {
  label: string;
  kind: ButtonKind;
  action: ButtonAction;
}

interface Position {
  isFirst: boolean;
  isLast: boolean;
  isMultiStep: boolean;
}

function planned(role: ButtonAction, action: FormAction | false | undefined, fallback: string, kind: ButtonKind, show: boolean): PlannedButton | null {
  if (!show || action === false) return null;
  return { label: action?.label || fallback, kind: action?.variant ?? kind, action: role };
}

export function stepButtons(definition: FormDefinition, step: StepActions, position: Position): PlannedButton[] {
  const { isFirst, isLast, isMultiStep } = position;
  return [
    isLast ? planned('submit', definition.submit, 'Submit', 'primary', true) : planned('next', step.next, 'Continue', 'primary', true),
    planned('back', step.back, 'Back', 'secondary', isMultiStep && !isFirst),
    planned('skip', step.skip, 'Skip', 'text', isMultiStep && Boolean(step.skip)),
    planned('cancel', definition.cancel, 'Cancel', 'text', Boolean(definition.cancel)),
  ].filter((button): button is PlannedButton => Boolean(button));
}

type Append = (parent: FrameNode, node: SceneNode | null) => void;

async function renderButton(button: PlannedButton, renderer: FormRenderer): Promise<SceneNode | null> {
  const node = await renderer.button(button.label, button.kind);
  node?.setSharedPluginData(PLUGIN_NAMESPACE, ACTION_KEY, button.action);
  return node;
}

async function renderRow(name: string, buttons: PlannedButton[], renderer: FormRenderer): Promise<FrameNode> {
  const row = stack('HORIZONTAL', name, { itemSpacing: renderer.theme.actionsGap });
  for (const button of buttons) {
    const node = await renderButton(button, renderer);
    if (node) row.appendChild(node);
  }
  return row;
}

export async function appendActions(frame: FrameNode, buttons: PlannedButton[], renderer: FormRenderer, layout: FormLayout, append: Append): Promise<void> {
  if (buttons.length === 0) return;
  const actions = stack('VERTICAL', 'Actions', { itemSpacing: renderer.theme.actionsGap });
  append(frame, actions);
  if (layout.actions === 'stacked') {
    for (const button of buttons) append(actions, await renderButton(button, renderer));
    return;
  }
  const filled = buttons.filter((button) => button.kind !== 'text').sort((left, right) => (left.kind === 'primary' ? 1 : 0) - (right.kind === 'primary' ? 1 : 0));
  const links = buttons.filter((button) => button.kind === 'text');
  for (const [name, group] of [['Buttons', filled], ['Links', links]] as const) {
    if (group.length === 0) continue;
    const row = await renderRow(name, group, renderer);
    append(actions, row);
    for (const child of row.children) if ('layoutSizingHorizontal' in child) child.layoutSizingHorizontal = 'FILL';
  }
}
