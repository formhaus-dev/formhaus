import type { BuilderPage, BuilderQuestion } from '@formhaus/builder';
import { Rows3 } from 'lucide-react';
import { memo, useState } from 'react';
import { AddRow, Button, Sortable } from '../ui';
import { ButtonsCard } from './ButtonsCard';
import { useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Canvas.module.css';
import { FieldCard } from './FieldCard';
import { FieldPalette } from './FieldPalette';
import { useFocusRequests } from './focus';
import { InsertGap } from './InsertGap';
import { presetFor } from './presets';
import { StepHeaderCard } from './StepHeaderCard';

interface Props {
  step: string | null;
  page: BuilderPage | null;
  first: boolean;
  last: boolean;
  fields: BuilderQuestion[];
  header: { position: number; total: number } | null;
  actions: EditorActions;
}

const sameFields = (a: BuilderQuestion[], b: BuilderQuestion[]) => a.length === b.length && a.every((field, index) => field === b[index]);

const sameSection = (a: Props, b: Props) =>
  a.step === b.step &&
  a.page === b.page &&
  a.first === b.first &&
  a.last === b.last &&
  a.actions === b.actions &&
  a.header?.position === b.header?.position &&
  a.header?.total === b.header?.total &&
  sameFields(a.fields, b.fields);

export const StepSection = memo(function StepSection({ step, page, first, last, fields, header, actions }: Props) {
  const readOnly = useReadOnly();
  const focus = useFocusRequests();
  const [palette, setPalette] = useState(false);
  const name = header ? `step ${String(header.position)}` : 'the form';
  const labelOf = (field: BuilderQuestion) => field.label.trim() || 'Untitled question';
  return (
    <section className={styles.section} aria-label={header ? `Step ${String(header.position)}` : 'Fields'} data-step={step ?? 'root'}>
      {step && header && <StepHeaderCard uid={step} position={header.position} total={header.total} actions={actions} />}
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
            {!readOnly && field !== fields.at(-1) && <InsertGap after={field.uid} label={labelOf(field)} actions={actions} />}
          </>
        )}
      />
      {!readOnly && (
        <div className={styles.addRow}>
          <FieldPalette
            open={palette}
            onOpenChange={setPalette}
            label="Add a field"
            trigger={<AddRow label="Add field" inset="card" />}
            adding
            onPick={(id) => {
              const preset = presetFor(id);
              const uid = actions.addField({ step }, preset);
              if (uid) focus.request(uid, preset.label ? 'card' : 'label');
            }}
          />
          <Button
            variant="ghost"
            icon={<Rows3 aria-hidden />}
            onClick={() => {
              actions.addStep(step ?? undefined);
            }}
          >
            Add step
          </Button>
        </div>
      )}
      <ButtonsCard step={page} first={first} last={last} actions={actions} />
    </section>
  );
}, sameSection);
