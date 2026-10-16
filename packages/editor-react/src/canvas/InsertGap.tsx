import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { EditorActions } from '../useEditorActions';
import styles from './InsertGap.module.css';
import { FieldPalette } from './FieldPalette';
import { useFocusRequests } from './focus';
import { addPicked } from './presets';

export function InsertGap({ after, label, actions }: { after: string; label: string; actions: EditorActions }) {
  const [open, setOpen] = useState(false);
  const focus = useFocusRequests();
  return (
    <div className={styles.gap}>
      <FieldPalette
        open={open}
        onOpenChange={setOpen}
        label="Insert a field"
        adding
        trigger={
          <button type="button" className={styles.insert} aria-label={`Insert a field after ${label}`}>
            <span className={styles.circle}>
              <Plus aria-hidden />
            </span>
          </button>
        }
        onPick={(id) => {
          const added = addPicked(actions, { after }, id);
          if (added) focus.request(added.uid, added.target);
        }}
      />
    </div>
  );
}
