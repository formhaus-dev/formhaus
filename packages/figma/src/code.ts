import { setComponentMap, getComponentMap, type ComponentMap } from './constants';
import { countFields, getSteps, parseAndValidate } from './parse';
import { renderForm } from './render-form';

const STORAGE_KEY = 'formhaus-component-map';

figma.showUI(__html__, { width: 480, height: 600 });

// Load custom component map from storage on startup
async function loadStoredComponentMap(): Promise<void> {
  try {
    const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
    if (stored) {
      setComponentMap(stored as ComponentMap);
      figma.ui.postMessage({ type: 'componentMapStatus', isCustom: true });
    } else {
      figma.ui.postMessage({ type: 'componentMapStatus', isCustom: false });
    }
  } catch (_e) {
    figma.ui.postMessage({ type: 'componentMapStatus', isCustom: false });
  }
}

// Send current component map to UI
function sendComponentMapToUI(): void {
  const map = getComponentMap();
  figma.ui.postMessage({ type: 'componentMapData', map: JSON.stringify(map, null, 2) });
}

loadStoredComponentMap();

figma.ui.onmessage = async (msg: { type: string; definition?: string; componentMap?: string }) => {
  if (msg.type === 'generate' && msg.definition) {
    try {
      const definition = parseAndValidate(msg.definition);
      const frames = await renderForm(definition);
      figma.viewport.scrollAndZoomIntoView(frames);
      const steps = getSteps(definition);
      const stepInfo = steps.length > 1 ? ` across ${steps.length} frames` : '';
      figma.ui.postMessage({
        type: 'success',
        message: `Generated "${definition.title}" with ${countFields(definition)} fields${stepInfo}`,
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      figma.ui.postMessage({ type: 'error', message });
    }
  }

  if (msg.type === 'setComponentMap' && msg.componentMap) {
    try {
      const parsed = JSON.parse(msg.componentMap) as ComponentMap;
      // Basic validation
      if (!parsed.formsConstructorKey || !parsed.buttonKey || !parsed.fields || !parsed.textLayerNames) {
        throw new Error('Invalid component map: must include formsConstructorKey, buttonKey, fields, and textLayerNames.');
      }
      setComponentMap(parsed);
      await figma.clientStorage.setAsync(STORAGE_KEY, parsed);
      figma.ui.postMessage({
        type: 'componentMapSaved',
        message: 'Component map saved successfully.',
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      figma.ui.postMessage({ type: 'componentMapError', message });
    }
  }

  if (msg.type === 'resetComponentMap') {
    try {
      await figma.clientStorage.deleteAsync(STORAGE_KEY);
      const { resetComponentMap } = await import('./constants');
      resetComponentMap();
      figma.ui.postMessage({
        type: 'componentMapSaved',
        message: 'Reset to default component map.',
      });
      figma.ui.postMessage({ type: 'componentMapStatus', isCustom: false });
      sendComponentMapToUI();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      figma.ui.postMessage({ type: 'componentMapError', message });
    }
  }

  if (msg.type === 'getComponentMap') {
    sendComponentMapToUI();
  }
};
