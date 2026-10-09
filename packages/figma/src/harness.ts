import type { FormDefinition } from '@formhaus/core';
import { runBindingMessage } from './bindings/messages';
import { readConfig, writeConfig, type KitId } from './config';
import { renderForm } from './render-form';
import { createKitRenderer } from './renderers/kit-renderer';

async function render(definition: FormDefinition, kit: KitId = 'material', useBindings = false) {
  writeConfig({ ...readConfig(), source: useBindings ? 'custom' : 'kit', kit });
  const config = readConfig();
  const frames = await renderForm(definition, await createKitRenderer(useBindings ? config : { ...config, bindings: {} }));
  return frames.map((frame) => ({
    id: frame.id,
    name: frame.name,
    height: Math.round(frame.height),
    children: frame.children.map((child) => `${child.type}:${child.name}`),
  }));
}

(globalThis as unknown as { formhaus: object }).formhaus = { render, binding: runBindingMessage };
