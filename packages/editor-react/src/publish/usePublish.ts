import { slugBase } from '@formhaus/builder';
import { useState } from 'react';
import { PublishRefused, PublishRejected, SaveConflict, StaleBase } from '../host';
import { useEditorHandle } from '../store/context';
import { localProblems, serverProblems, type PublishProblem } from './problems';

export function usePublish() {
  const { store, autosave, host } = useEditorHandle();
  const [pending, setPending] = useState(false);
  const [problems, setProblems] = useState<PublishProblem[]>([]);
  const [stale, setStale] = useState<number | null>(null);

  async function publish({ overwrite = false, force = false } = {}) {
    const form = store.getState().form;
    const local = localProblems(form);
    if (local.some((problem) => problem.severity === 'error') || (!force && local.length)) {
      setProblems(local);
      return;
    }
    if (!autosave || !host.publish) return;
    setPending(true);
    setProblems([]);
    try {
      if (host.isNew && form.id === 'untitled-form' && form.title.trim()) {
        store.update((draft) => {
          draft.id = slugBase(draft.title, 'form');
        });
      }
      await autosave.flush(host.isNew && !host.stored());
      if (store.getState().save.status === 'conflict' || store.getState().save.status === 'error') return;
      const published = await host.publish(autosave.revision(), overwrite);
      setStale(null);
      autosave.rebase(0);
      host.notify({ title: host.isNew ? 'Form published' : `Published version ${String(published.version)}`, tone: 'success' });
      if (published.warnings.length) host.notify({ title: 'Published with warnings', description: published.warnings.join(' ') });
      host.onPublished?.(published);
    } catch (error) {
      if (error instanceof StaleBase) setStale(error.latest);
      else if (error instanceof SaveConflict) store.setSave({ status: 'conflict', conflict: error.remote });
      else if (error instanceof PublishRejected) setProblems(serverProblems(store.getState().form, error.problems));
      else if (error instanceof PublishRefused) host.notify(error.notice);
      else host.notify({ title: 'Could not publish', description: host.describeError(error), tone: 'danger' });
    } finally {
      setPending(false);
    }
  }

  return {
    publish,
    pending,
    problems,
    stale,
    dismiss: () => {
      setProblems([]);
    },
    cancelStale: () => {
      setStale(null);
    },
  };
}
