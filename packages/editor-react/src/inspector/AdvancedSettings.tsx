import type { BuilderQuestion } from '@formhaus/builder';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { ResponseKey } from './ResponseKey';

export function AdvancedSettings({ field, actions, readOnly }: { field: BuilderQuestion; actions: EditorActions; readOnly: boolean }) {
  const [open, setOpen] = useState(() => !field.key.trim());
  const body = useId();
  return (
    <section className={styles.block} aria-label="Advanced">
      <Button
        variant="ghost"
        align="start"
        className={styles.disclosure}
        aria-expanded={open}
        aria-controls={body}
        onClick={() => {
          setOpen(!open);
        }}
      >
        Advanced
        {open ? <ChevronUp aria-hidden /> : <ChevronDown aria-hidden />}
      </Button>
      {open && (
        <div id={body} className={styles.wide}>
          <ResponseKey field={field} actions={actions} readOnly={readOnly} />
        </div>
      )}
    </section>
  );
}
