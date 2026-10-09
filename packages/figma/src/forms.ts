import type { FormDefinition } from '@formhaus/core';
import { PLUGIN_NAMESPACE } from './config';
import { normalizeLayout, type FormLayout } from './render-actions';
import { DEFINITION_KEY, LAYOUT_KEY } from './render-form';

function formFrame(node: BaseNode | null): FrameNode | null {
  for (let current = node; current && current.type !== 'PAGE'; current = current.parent) {
    if (current.type === 'FRAME' && current.getSharedPluginData(PLUGIN_NAMESPACE, 'definitionId')) return current;
  }
  return null;
}

export interface SelectedForm {
  definition: FormDefinition;
  layout: FormLayout;
}

function parse<T>(text: string | undefined): T | null {
  try {
    return text ? (JSON.parse(text) as T) : null;
  } catch {
    return null;
  }
}

export function selectedForm(selection: readonly SceneNode[]): SelectedForm | null {
  const frame = formFrame(selection[0] ?? null);
  const definition = parse<FormDefinition>(frame?.getSharedPluginData(PLUGIN_NAMESPACE, DEFINITION_KEY));
  if (!frame || !definition) return null;
  return { definition, layout: normalizeLayout(parse<FormLayout>(frame.getSharedPluginData(PLUGIN_NAMESPACE, LAYOUT_KEY))) };
}
