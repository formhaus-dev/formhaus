import { setFieldType, type BuilderQuestion } from '@formhaus/builder';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { typeIcon, typeLabel } from '../fieldTypes';
import { useIsMatrixRow } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './TypeChip.module.css';
import { FieldPalette } from './FieldPalette';

export function TypeChip({ field, actions, disabled }: { field: BuilderQuestion; actions: EditorActions; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const row = useIsMatrixRow(field.uid);
  const kind = (field.extra as { layout?: string }).layout === 'matrix' ? 'matrix' : field.type;
  const chip = (
    <button
      type="button"
      className={styles.chip}
      disabled={disabled}
      aria-label={`Field type: ${typeLabel(kind)}. Change type`}
      title={typeLabel(kind)}
    >
      {typeIcon(kind)}
      <span>{typeLabel(kind)}</span>
      {!disabled && <ChevronDown aria-hidden className={styles.chipChevron} />}
    </button>
  );
  if (disabled) return chip;
  return (
    <FieldPalette
      open={open}
      onOpenChange={setOpen}
      trigger={chip}
      label={row ? 'Matrix rows are multiple choice or checkboxes' : 'Change field type'}
      only={row ? ['radio', 'multiselect'] : undefined}
      onPick={(type) => {
        actions.edit((form) => {
          setFieldType(form, field.uid, type);
        });
      }}
    />
  );
}
