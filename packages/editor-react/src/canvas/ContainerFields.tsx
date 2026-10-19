import { childrenOf, isContainer, type BuilderQuestion } from '@formhaus/builder';
import { useState } from 'react';
import { AddRow, Sortable } from '../ui';
import { useForm, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Canvas.module.css';
import { FieldCard } from './FieldCard';
import { FieldPalette } from './FieldPalette';
import { useFocusRequests } from './focus';
import { InsertGap } from './InsertGap';
import { addPicked } from './presets';

const labelOf = (field: BuilderQuestion) => field.label.trim() || 'Untitled question';

function ContainerFields({ container, step, actions }: { container: BuilderQuestion; step: string | null; actions: EditorActions }) {
  const form = useForm();
  const readOnly = useReadOnly();
  const focus = useFocusRequests();
  const [palette, setPalette] = useState(false);
  const fields = childrenOf(form, container.uid);
  const name = labelOf(container);
  return (
    <div className={styles.nested} role="group" aria-label={`Fields in ${name}`}>
      <FieldList fields={fields} name={name} step={step} actions={actions} />
      {!readOnly && (
        <FieldPalette
          open={palette}
          onOpenChange={setPalette}
          label={`Add a field to ${name}`}
          trigger={<AddRow label={`Add field to ${name}`} inset="card" />}
          adding
          onPick={(id) => {
            const added = addPicked(actions, { inside: container.uid }, id);
            if (added) focus.request(added.uid, added.target);
          }}
        />
      )}
    </div>
  );
}

export function FieldList({
  fields,
  name,
  step,
  actions,
}: {
  fields: BuilderQuestion[];
  name: string;
  step: string | null;
  actions: EditorActions;
}) {
  const readOnly = useReadOnly();
  const focus = useFocusRequests();
  return (
    <Sortable
      items={fields.map((field) => ({ id: field.uid, field }))}
      label={`Fields in ${name}`}
      getLabel={({ field }) => labelOf(field)}
      onMove={(id, to) => {
        focus.request(id, 'card');
        actions.moveTo(id, step, to);
      }}
      renderItem={({ field }, { handleProps }) => (
        <>
          <FieldCard uid={field.uid} handleProps={handleProps} actions={actions} />
          {isContainer(field) && <ContainerFields container={field} step={step} actions={actions} />}
          {!readOnly && field !== fields.at(-1) && <InsertGap after={field.uid} label={labelOf(field)} actions={actions} />}
        </>
      )}
    />
  );
}
