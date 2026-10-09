import { isAiMessage, runAiMessage, type AiMessage } from './ai-keys';
import { migrateStoredMap } from './bindings/legacy-map';
import { applyDefaultProfile } from './profiles';
import { selectionPreview } from './bindings/selection-preview';
import { isBindingMessage, runBindingMessage, type BindingMessage } from './bindings/messages';
import { PLUGIN_NAMESPACE, readConfig, writeConfig, type ComponentSource, type KitId, type PluginConfig } from './config';
import { droppedRole, placeRole } from './drop';
import { selectedForm } from './forms';
import { countFields, getSteps, parseAndValidate } from './parse';
import { normalizeLayout, type FormLayout } from './render-actions';
import { DEFINITION_KEY, renderForm } from './render-form';
import { createKitRenderer } from './renderers/kit-renderer';
import type { Role } from './roles';

interface UiMessage extends BindingMessage, Omit<AiMessage, 'type'> {
  definition?: string;
  layout?: FormLayout;
  kit?: KitId;
  source?: ComponentSource;
}

figma.showUI(__html__, { width: 480, height: 680, themeColors: true });
void start();

async function start(): Promise<void> {
  const migrated = await migrateStoredMap().catch(() => 0);
  const profile = await applyDefaultProfile().catch(() => null);
  const { source, bindings } = currentConfig();
  if (source === 'custom' && Object.keys(bindings).length === 0) updateComponents('kit');
  sendState();
  void sendSelection();
  if (migrated > 0) notice(`Your saved JSON component map is now the “Saved component map” design system: ${migrated} elements bound.`);
  else if (profile) notice(`Using your “${profile}” design system in this new file.`);
}

function notice(message: string): void {
  figma.ui.postMessage({ type: 'notice', message });
}
figma.on('selectionchange', () => void sendSelection());
figma.on('drop', (event) => {
  const role = droppedRole(event);
  if (!role) return true;
  void placeDrop(event, role);
  return false;
});

figma.ui.onmessage = async (message: UiMessage) => {
  if (message.type === 'generate' && message.definition) await generateForm(message.definition, message.layout);
  else if (message.type === 'setComponents') updateComponents(message.source, message.kit);
  else if (isAiMessage(message.type)) figma.ui.postMessage(await runAiMessage(message));
  else if (isBindingMessage(message.type)) {
    await updateBindings(message);
    sendState();
    if (message.type === 'getBindings') await sendSelection();
  }
};

function currentConfig(): PluginConfig {
  return readConfig();
}

function rendererConfig(): PluginConfig {
  const config = currentConfig();
  return config.source === 'kit' ? { ...config, bindings: {} } : config;
}

let selectionTick = 0;

async function sendSelection(): Promise<void> {
  const tick = ++selectionTick;
  const selection = figma.currentPage.selection;
  const form = selectedForm(selection);
  figma.ui.postMessage({ type: 'form', definition: form?.definition ?? null, layout: form?.layout });
  const item = await selectionPreview(selection);
  if (tick === selectionTick) figma.ui.postMessage({ type: 'selection', item });
}

async function placeDrop(event: DropEvent, role: Role): Promise<void> {
  try {
    await placeRole(event, role, rendererConfig());
    figma.commitUndo();
  } catch (error) {
    postError('bindingsError', error);
  }
}

function sendState(): void {
  const { source, kit, bindings } = currentConfig();
  figma.ui.postMessage({ type: 'state', source, kit, boundCount: Object.keys(bindings).length });
}

async function updateBindings(message: BindingMessage): Promise<void> {
  try {
    figma.ui.postMessage({ type: 'bindings', ...(await runBindingMessage(message)) });
    const { source, bindings } = currentConfig();
    if (source === 'custom' && Object.keys(bindings).length === 0) updateComponents('kit');
  } catch (error) {
    postError('bindingsError', error);
  }
}

function updateComponents(source?: ComponentSource, kit?: KitId): void {
  const config = currentConfig();
  writeConfig({ ...config, source: source ?? config.source, kit: kit ?? config.kit });
  sendState();
}

function editable(frames: FrameNode[]): string {
  return frames[0]?.getSharedPluginData(PLUGIN_NAMESPACE, DEFINITION_KEY) ? '' : '. The form is too large to edit from the canvas.';
}

async function generateForm(source: string, layout?: Partial<FormLayout>): Promise<void> {
  try {
    const definition = parseAndValidate(source);
    const frames = await renderForm(definition, await createKitRenderer(rendererConfig()), normalizeLayout(layout));
    figma.commitUndo();
    figma.currentPage.selection = frames.slice(0, 1);
    figma.viewport.scrollAndZoomIntoView(frames);
    const stepCount = getSteps(definition).length;
    const stepInfo = stepCount > 1 ? ` across ${stepCount} frames` : '';
    figma.ui.postMessage({
      type: 'success',
      message: `Generated "${definition.title}" with ${countFields(definition)} fields${stepInfo}${editable(frames)}`,
    });
  } catch (error) {
    postError('error', error);
  }
}

function postError(type: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  figma.ui.postMessage({ type, message });
}
