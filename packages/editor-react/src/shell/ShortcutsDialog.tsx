import { Dialog, Kbd } from '../ui';
import { keyHint, redoHint, undoHint } from './keys';
import styles from './EditorShell.module.css';

const rows = (): [string, string[]][] => [
  ['Undo', [undoHint()]],
  ['Redo', [redoHint(), keyHint('Y')]],
  ['Add a field below', ['Enter']],
  ['Pick a field type in an empty label', ['/']],
  ['Delete the selected field', ['Delete']],
  ['Duplicate the selected field', [keyHint('D')]],
  ['Move the selected field', ['Alt+↑', 'Alt+↓']],
  ['Switch between Visual and JSON', [keyHint('\\')]],
  ['Show these shortcuts', ['?', keyHint('/')]],
];

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog title="Keyboard shortcuts" open={open} onOpenChange={onOpenChange}>
      <dl className={styles.shortcuts}>
        {rows().map(([label, keys]) => (
          <div key={label} className={styles.shortcut}>
            <dt>{label}</dt>
            <dd>
              {keys.map((key) => (
                <Kbd key={key}>{key}</Kbd>
              ))}
            </dd>
          </div>
        ))}
      </dl>
    </Dialog>
  );
}
