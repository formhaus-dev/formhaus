import { setFormProp, setFormTitle, setSubmitLabel } from '@formhaus/builder';
import { useRef } from 'react';
import { Settings2 } from 'lucide-react';
import { InlineText, Input } from '../ui';
import { useEditorStore } from '../store/context';
import { useForm, useIsExpanded, useIsSelected, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import { phone, useMedia } from '../useMedia';
import styles from './Canvas.module.css';
import { closeSettingsOnEscape, toggleSettings } from './settings';

export function FormHeaderCard({ actions }: { actions: EditorActions }) {
  const form = useForm();
  const store = useEditorStore();
  const selected = useIsSelected({ kind: 'form' });
  const expanded = useIsExpanded('form');
  const readOnly = useReadOnly();
  const title = useRef<HTMLTextAreaElement>(null);
  const small = useMedia(phone);

  const select = () => {
    if (!selected) store.select({ kind: 'form' });
  };
  const settings = (
    <div className={styles.headerSettings} data-settings="form" onKeyDown={closeSettingsOnEscape(store, 'form')}>
      <label className={styles.settingRow}>
        <span className={styles.settingLabel}>Submit button</span>
        <Input
          value={form.submit}
          placeholder="Submit"
          readOnly={readOnly}
          onFocus={select}
          onChange={(event) => {
            actions.edit((draft) => {
              setSubmitLabel(draft, event.target.value);
            }, 'form:submit');
          }}
        />
      </label>
    </div>
  );
  return (
    <div
      className={styles.formHeader}
      role="group"
      aria-label="Form title and description"
      onClick={(event) => {
        select();
        if (event.target === event.currentTarget) title.current?.focus();
      }}
    >
      <InlineText
        ref={title}
        value={form.title}
        label="Form title"
        placeholder="Form title"
        size="xl"
        ring
        readOnly={readOnly}
        onFocus={select}
        onValueChange={(value) => {
          actions.edit((draft) => {
            setFormTitle(draft, value);
          }, 'form:title');
        }}
      />
      <InlineText
        value={form.extra.description ?? ''}
        label="Form description"
        placeholder="Description"
        tone="muted"
        multiline
        ring
        readOnly={readOnly}
        onFocus={select}
        onValueChange={(value) => {
          actions.edit((draft) => {
            setFormProp(draft, 'description', value);
          }, 'form:description');
        }}
      />
      {small && !readOnly ? (
        <>
          <button
            type="button"
            className={styles.headerToggle}
            aria-expanded={expanded}
            data-settings-toggle="form"
            onClick={() => {
              toggleSettings(store, 'form', expanded);
            }}
          >
            <Settings2 aria-hidden />
            Form settings
          </button>
          {expanded && settings}
        </>
      ) : (
        settings
      )}
    </div>
  );
}
