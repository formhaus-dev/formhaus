import { onBeforeUnmount, onMounted, reactive, type Ref, watch } from 'vue';
import type { Issue } from './definition';

export function usePreviews(definition: Ref<object | null>, dark: Ref<boolean>, onSettled?: (id: string) => void) {
  const loaded = reactive(new Set<string>());
  const ready = reactive(new Set<string>());
  const rendered = reactive(new Set<string>());
  const issues = reactive(new Map<string, Issue[]>());
  const frames = new Map<string, HTMLIFrameElement>();
  const sent = new Map<string, string>();

  function post(id: string, message: object) {
    frames.get(id)?.contentWindow?.postMessage(message, location.origin);
  }

  function sendTheme(id: string) {
    post(id, { type: 'formhaus:theme', theme: dark.value ? 'dark' : 'light' });
  }

  function send(id: string) {
    if (!ready.has(id) || !definition.value) return false;
    const payload = JSON.stringify(definition.value);
    if (sent.get(id) === payload) return false;
    sent.set(id, payload);
    post(id, { type: 'formhaus:definition', definition: definition.value });
    return true;
  }

  function bind(id: string, element: unknown) {
    if (element instanceof HTMLIFrameElement) frames.set(id, element);
  }

  function onMessage(event: MessageEvent) {
    if (event.origin !== location.origin) return;
    const id = [...frames].find(([, frame]) => frame.contentWindow === event.source)?.[0];
    if (!id) return;
    const data = event.data as { type?: string; issues?: Issue[] };
    if (data.type === 'formhaus:ready') {
      ready.add(id);
      sendTheme(id);
      send(id);
    } else if (data.type === 'formhaus:rendered') {
      issues.delete(id);
      rendered.add(id);
      onSettled?.(id);
    } else if (data.type === 'formhaus:error') {
      issues.set(
        id,
        (data.issues ?? []).map((issue) => ({ ...issue, severity: 'error' })),
      );
      onSettled?.(id);
    }
  }

  watch(dark, () => {
    for (const id of ready) sendTheme(id);
  });
  onMounted(() => window.addEventListener('message', onMessage));
  onBeforeUnmount(() => window.removeEventListener('message', onMessage));

  return { loaded, rendered, issues, bind, send };
}
