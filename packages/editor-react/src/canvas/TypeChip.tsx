import { setFieldType, type BuilderQuestion } from '@formhaus/builder';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { typeIcon, typeLabel } from '../fieldTypes';
import type { EditorActions } from '../useEditorActions';
import styles from './TypeChip.module.css';
import { FieldPalette } from './FieldPalette';

export function TypeChip({ field, actions, disabled }: { field: BuilderQuestion; actions: EditorActions; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  const chip = (
    <button type="button" className={styles.chip} disabled={disabled} aria-label={`Field type: ${typeLabel(field.type)}. Change type`} title={typeLabel(field.type)}>
      {typeIcon(field.type)}
      <span>{typeLabel(field.type)}</span>
      {!disabled && <ChevronDown aria-hidden className={styles.chipChevron} />}
    </button>
  );
  if (disabled) return chip;
  return (
    <FieldPalette
      open={open}
      onOpenChange={setOpen}
      trigger={chip}
      label="Change field type"
      onPick={(type) => {
        actions.edit((form) => {
          setFieldType(form, field.uid, type);
        });
      }}
    />
  );
}
