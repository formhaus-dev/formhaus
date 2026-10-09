import { selectionPreview } from './bindings/selection-preview';
import { isBindingMessage, runBindingMessage, type BindingMessage } from './bindings/messages';
import { readConfig, writeConfig, type ComponentSource, type KitId, type PluginConfig } from './config';
import { getComponentMap, resetComponentMap, setComponentMap, type ComponentMap } from './constants';
import { droppedRole, placeRole } from './drop';
import { countFields, getSteps, parseAndValidate } from './parse';
import { renderForm } from './render-form';
import { createKitRenderer } from './renderers/kit-renderer';
import { createLegacyRenderer } from './renderers/legacy-renderer';
import type { FormRenderer } from './renderers/types';
import type { Role } from './roles';

const STORAGE_KEY = 'formhaus-component-map';

interface UiMessage extends BindingMessage {
  definition?: string;
  componentMap?: string;
  kit?: KitId;
  source?: ComponentSource;
}

let hasStoredMap = false;

figma.showUI(__html__, { width: 480, height: 680, themeColors: true });
loadStoredComponentMap().then(sendState);
figma.on('selectionchange', () => void sendSelection());
figma.on('drop', (event) => {
  const role = droppedRole(event);
  if (!role) return true;
  void placeDrop(event, role);
  return false;
});

figma.ui.onmessage = async (message: UiMessage) => {
  if (message.type === 'generate' && message.definition) await generateForm(message.definition);
  else if (message.type === 'setComponents') updateComponents(message.source, message.kit);
  else if (message.type === 'setComponentMap' && message.componentMap) await saveComponentMap(message.componentMap);
  else if (message.type === 'resetComponentMap') await clearComponentMap();
  else if (message.type === 'getComponentMap') sendComponentMapToUi();
  else if (isBindingMessage(message.type)) {
    await updateBindings(message);
    sendState();
    if (message.type === 'getBindings') await sendSelection();
  }
};

async function loadStoredComponentMap(): Promise<void> {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
    hasStoredMap = Boolean(stored);
    if (stored) setComponentMap(stored as ComponentMap);
  } catch {
    hasStoredMap = false;
  }
}

function currentConfig(): PluginConfig {
  return readConfig(hasStoredMap ? 'custom' : 'kit');
}

function rendererConfig(): PluginConfig {
  const config = currentConfig();
  return config.source === 'kit' ? { ...config, bindings: {} } : config;
}

let selectionTick = 0;

async function sendSelection(): Promise<void> {
  const tick = ++selectionTick;
  const item = await selectionPreview(figma.currentPage.selection);
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
  figma.ui.postMessage({ type: 'state', source, kit, hasStoredMap, boundCount: Object.keys(bindings).length });
}

async function updateBindings(message: BindingMessage): Promise<void> {
  try {
    figma.ui.postMessage({ type: 'bindings', ...(await runBindingMessage(message, currentConfig().source)) });
    const { source, bindings } = currentConfig();
    if (source === 'custom' && Object.keys(bindings).length === 0 && !hasStoredMap) updateComponents('kit');
  } catch (error) {
    postError('bindingsError', error);
  }
}

function updateComponents(source?: ComponentSource, kit?: KitId): void {
  const config = currentConfig();
  writeConfig({ ...config, source: source ?? config.source, kit: kit ?? config.kit });
  sendState();
}

async function createRenderer(): Promise<FormRenderer> {
  const config = currentConfig();
  if (config.source === 'kit' || Object.keys(config.bindings).length > 0) return createKitRenderer(rendererConfig());
  if (!hasStoredMap) throw new Error('Bind your components in the Components tab, or switch to a built-in kit.');
  return createLegacyRenderer();
}

async function generateForm(source: string): Promise<void> {
  try {
    const definition = parseAndValidate(source);
    const frames = await renderForm(definition, await createRenderer());
    figma.commitUndo();
    figma.viewport.scrollAndZoomIntoView(frames);
    const stepCount = getSteps(definition).length;
    const stepInfo = stepCount > 1 ? ` across ${stepCount} frames` : '';
    figma.ui.postMessage({
      type: 'success',
      message: `Generated "${definition.title}" with ${countFields(definition)} fields${stepInfo}`,
    });
  } catch (error) {
    postError('error', error);
  }
}

async function saveComponentMap(source: string): Promise<void> {
  try {
    const map = JSON.parse(source) as ComponentMap;
    assertComponentMap(map);
    setComponentMap(map);
    await figma.clientStorage.setAsync(STORAGE_KEY, map);
    hasStoredMap = true;
    updateComponents('custom');
    figma.ui.postMessage({ type: 'componentMapSaved', message: 'Component map saved. Generating with your components.' });
  } catch (error) {
    postError('componentMapError', error);
  }
}

async function clearComponentMap(): Promise<void> {
  try {
    await figma.clientStorage.deleteAsync(STORAGE_KEY);
    resetComponentMap();
    hasStoredMap = false;
    updateComponents('kit');
    figma.ui.postMessage({ type: 'componentMapSaved', message: 'Component map removed. Generating with the built-in kit.' });
    sendComponentMapToUi();
  } catch (error) {
    postError('componentMapError', error);
  }
}

function assertComponentMap(map: ComponentMap): void {
  if (!map.formsConstructorKey || !map.buttonKey || !map.fields || !map.textLayerNames) {
    throw new Error(
      'Invalid component map: must include formsConstructorKey, buttonKey, fields, and textLayerNames.',
    );
  }
}

function sendComponentMapToUi(): void {
  figma.ui.postMessage({ type: 'componentMapData', map: JSON.stringify(getComponentMap(), null, 2) });
}

function postError(type: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  figma.ui.postMessage({ type, message });
}
