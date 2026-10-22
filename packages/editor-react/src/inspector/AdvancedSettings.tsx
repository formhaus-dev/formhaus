import type { BuilderQuestion } from '@formhaus/builder';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useId, useState } from 'react';
import { Button } from '../ui';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';
import { ResponseKey } from './ResponseKey';

export function AdvancedSettings({ field, actions, readOnly }: { field: BuilderQuestion; actions: EditorActions; readOnly: boolean }) {
  const [opened, setOpened] = useState(false);
  const body = useId();
  const open = opened || !field.key.trim();
  return (
    <section className={styles.block} aria-label="Advanced">
      <Button
        variant="ghost"
        align="start"
        className={styles.disclosure}
        aria-expanded={open}
        aria-controls={body}
        onClick={() => {
          setOpened(!open);
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
