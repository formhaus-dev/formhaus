import {
  getComponentMap,
  resetComponentMap,
  setComponentMap,
  type ComponentMap,
} from './constants';
import { countFields, getSteps, parseAndValidate } from './parse';
import { renderForm } from './render-form';

const STORAGE_KEY = 'formhaus-component-map';

interface UiMessage {
  type: string;
  definition?: string;
  componentMap?: string;
}

figma.showUI(__html__, { width: 480, height: 600 });
loadStoredComponentMap();

figma.ui.onmessage = async (message: UiMessage) => {
  if (message.type === 'generate' && message.definition) {
    await generateForm(message.definition);
  } else if (message.type === 'setComponentMap' && message.componentMap) {
    await saveComponentMap(message.componentMap);
  } else if (message.type === 'resetComponentMap') {
    await clearComponentMap();
  } else if (message.type === 'getComponentMap') {
    sendComponentMapToUi();
  }
};

async function loadStoredComponentMap(): Promise<void> {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
    if (stored) setComponentMap(stored as ComponentMap);
    sendMapStatus(!!stored);
  } catch {
    sendMapStatus(false);
  }
}

async function generateForm(source: string): Promise<void> {
  try {
    const definition = parseAndValidate(source);
    const frames = await renderForm(definition);
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
    figma.ui.postMessage({ type: 'componentMapSaved', message: 'Component map saved successfully.' });
  } catch (error) {
    postError('componentMapError', error);
  }
}

async function clearComponentMap(): Promise<void> {
  try {
    await figma.clientStorage.deleteAsync(STORAGE_KEY);
    resetComponentMap();
    figma.ui.postMessage({ type: 'componentMapSaved', message: 'Reset to default component map.' });
    sendMapStatus(false);
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
  figma.ui.postMessage({
    type: 'componentMapData',
    map: JSON.stringify(getComponentMap(), null, 2),
  });
}

function sendMapStatus(isCustom: boolean): void {
  figma.ui.postMessage({ type: 'componentMapStatus', isCustom });
}

function postError(type: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  figma.ui.postMessage({ type, message });
}
