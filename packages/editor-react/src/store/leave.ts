import type { SaveStatus } from './store';
import type { EditorHandle } from './context';

const unsaved = new Set<SaveStatus>(['pending', 'saving', 'error', 'conflict']);
const sessions = new Set<EditorHandle>();
let prompt: (() => Promise<boolean>) | null = null;

export const isUnsaved = (handle: EditorHandle) => unsaved.has(handle.store.getState().save.status);

export function trackLeave(handle: EditorHandle): () => void {
  sessions.add(handle);
  return () => {
    sessions.delete(handle);
  };
}

export const hasUnsavedChanges = () => [...sessions].some((handle) => !handle.host.ephemeral && isUnsaved(handle));

export async function settleChanges(timeout = 4000): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const late = new Promise<void>((resolve) => {
    timer = setTimeout(resolve, timeout);
  });
  await Promise.race([Promise.all([...sessions].map((handle) => handle.autosave?.flush() ?? Promise.resolve())), late]);
  clearTimeout(timer);
  return !hasUnsavedChanges();
}

export function setLeavePrompt(next: () => Promise<boolean>): () => void {
  prompt = next;
  return () => {
    if (prompt === next) prompt = null;
  };
}

export async function confirmLeave(): Promise<boolean> {
  if (await settleChanges()) return true;
  return prompt ? prompt() : true;
}
