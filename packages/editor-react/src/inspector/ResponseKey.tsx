import { setKey, unlockKey, type BuilderQuestion } from '@formhaus/builder';
import { useState } from 'react';
import { Banner, Button, Field, Input } from '../ui';
import { useEditorHandle } from '../store/context';
import type { EditorActions } from '../useEditorActions';
import styles from './Inspector.module.css';

export function ResponseKey({ field, actions, readOnly }: { field: BuilderQuestion; actions: EditorActions; readOnly: boolean }) {
  const { published } = useEditorHandle();
  const live = [...(published?.definition.fields ?? []), ...(published?.definition.steps ?? []).flatMap((step) => step.fields)].some(
    (entry) => entry.key === field.key,
  );
  const [renaming, setRenaming] = useState(false);
  const hint = live ? 'Used in responses' : field.keyLocked ? 'Custom key' : 'Follows the label';
  if (renaming || (!live && field.keyLocked && !readOnly)) {
    return (
      <div className={styles.pair}>
        <Field
          label="Response key"
          hint={
            live ? (
              hint
            ) : (
              <span className={styles.hintLine}>
                {hint}
                <Button
                  variant="link"
                  onClick={() => {
                    actions.edit((form) => {
                      unlockKey(form, field.uid);
                    });
                  }}
                >
                  Use label
                </Button>
              </span>
            )
          }
        >
          <Input
            mono
            value={field.key}
            spellCheck={false}
            autoCapitalize="off"
            readOnly={readOnly}
            onChange={(event) => {
              actions.edit((form) => {
                setKey(form, field.uid, event.target.value);
              }, `${field.uid}:key`);
            }}
          />
        </Field>
        {live && <Banner tone="warning">Existing responses and webhooks keep the old key. New responses use the new one.</Banner>}
      </div>
    );
  }
  return (
    <div className={styles.keyLine}>
      <span className={styles.settingLabel}>Response key</span>
      <code className={styles.keyValue}>{field.key}</code>
      <span className={styles.keyHint}>{hint}</span>
      {!readOnly && (
        <Button
          variant="link"
          onClick={() => {
            if (live) {
              setRenaming(true);
              return;
            }
            actions.edit((form) => {
              setKey(form, field.uid, field.key);
            }, `${field.uid}:key`);
          }}
        >
          {live ? 'Rename key' : 'Edit key'}
        </Button>
      )}
    </div>
  );
}
