import { addField, createForm, fromDefinition, type BuilderForm } from '@formhaus/builder';
import type { FormDefinition } from '@formhaus/core';
import type { Published, SavedDraft } from '../host';

export interface InitialEditor {
  form: BuilderForm;
  revision: number;
  stale: boolean;
  savedAt: string | null;
}

export function blankForm(): BuilderForm {
  const form = createForm('untitled-form', 'Untitled form');
  addField(form, { step: null });
  return form;
}

export function loader(published: Published | null) {
  return (definition: FormDefinition) => fromDefinition(definition, published ? { lockedFrom: published.definition } : {});
}

export function initialEditor(published: Published | null, draft: SavedDraft | null): InitialEditor {
  const load = loader(published);
  if (draft) {
    return {
      form: load(draft.definition),
      revision: draft.revision,
      stale: !!published && draft.baseVersion !== null && draft.baseVersion < published.version,
      savedAt: draft.savedAt,
    };
  }
  return {
    form: published ? load(published.definition) : blankForm(),
    revision: 0,
    stale: false,
    savedAt: null,
  };
}
