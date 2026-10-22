import type { BuilderQuestion } from '@formhaus/builder';
import { ChevronDown, ChevronRight } from 'lucide-react';
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
        icon={open ? <ChevronDown aria-hidden /> : <ChevronRight aria-hidden />}
        aria-expanded={open}
        aria-controls={body}
        onClick={() => {
          setOpened(!open);
        }}
      >
        Advanced
      </Button>
      {open && (
        <div id={body} className={styles.wide}>
          <ResponseKey field={field} actions={actions} readOnly={readOnly} />
        </div>
      )}
    </section>
  );
}
