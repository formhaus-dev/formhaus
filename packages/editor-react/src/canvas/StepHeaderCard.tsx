import { setStepProp, setStepTitle, stepFields } from '@formhaus/builder';
import { Settings2 } from 'lucide-react';
import { useLayoutEffect, useState } from 'react';
import { IconButton, InlineText } from '../ui';
import settings from '../inspector/Inspector.module.css';
import { StepPanel } from '../inspector/StepPanel';
import { LogicBadge } from '../logic/LogicBadge';
import { useEditorStore } from '../store/context';
import { useForm, useIsExpanded, useIsSelected, useReadOnly, useStep } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Canvas.module.css';
import { DeleteStepDialog } from './DeleteStepDialog';
import { focusCard, useFocusRequests } from './focus';
import { closeSettingsOnEscape, toggleSettings } from './settings';
import { StepMenu } from './StepMenu';

interface Props {
  uid: string;
  position: number;
  total: number;
  actions: EditorActions;
}

export function StepHeaderCard({ uid, position, total, actions }: Props) {
  const step = useStep(uid);
  const form = useForm();
  const store = useEditorStore();
  const selected = useIsSelected({ kind: 'step', uid });
  const expanded = useIsExpanded(uid);
  const readOnly = useReadOnly();
  const [confirm, setConfirm] = useState(false);
  const focus = useFocusRequests();
  useLayoutEffect(() => {
    const target = focus.take(uid);
    if (target) focusCard(uid, target);
  });
  if (!step) return null;
  const title = step.title.trim() || `Step ${String(position)}`;
  const description = step.extra.description ?? '';
  const select = () => {
    if (!selected) store.select({ kind: 'step', uid });
  };
  return (
    <div
      data-card={uid}
      className={styles.stepHeader}
      tabIndex={selected ? 0 : -1}
      role="group"
      aria-label={`${title}, step ${String(position)} of ${String(total)}`}
      onClick={select}
    >
      <div className={styles.stepRow}>
        <span className={styles.stepCount}>Step {position}</span>
        <InlineText
          data-focus="label"
          value={step.title}
          label="Step title"
          placeholder={`Step ${String(position)}`}
          size="lg"
          readOnly={readOnly}
          rowClassName={styles.stepTitle}
          onFocus={select}
          onValueChange={(value) => {
            actions.edit((draft) => {
              setStepTitle(draft, uid, value);
            }, `${uid}:title`);
          }}
        />
        {!readOnly && (
          <span className={styles.stepActions}>
            <IconButton
              label="Step settings"
              aria-expanded={expanded}
              data-settings-toggle={uid}
              icon={<Settings2 aria-hidden />}
              onClick={(event) => {
                event.stopPropagation();
                toggleSettings(store, uid, expanded);
              }}
            />
            <StepMenu
              uid={uid}
              position={position}
              total={total}
              actions={actions}
              onDelete={() => {
                setConfirm(true);
              }}
            />
          </span>
        )}
      </div>
      {(description || (selected && !readOnly)) && (
        <InlineText
          value={description}
          label="Step description"
          placeholder="Description"
          size="sm"
          tone="muted"
          multiline
          readOnly={readOnly}
          onFocus={select}
          onValueChange={(value) => {
            actions.edit((draft) => {
              setStepProp(draft, uid, 'description', value);
            }, `${uid}:description`);
          }}
        />
      )}
      <LogicBadge
        block={step}
        onOpen={() => {
          toggleSettings(store, uid, false);
        }}
      />
      {expanded && (
        <div className={settings.settings} data-settings={uid} onKeyDown={closeSettingsOnEscape(store, uid)}>
          <StepPanel step={step} actions={actions} />
        </div>
      )}
      <DeleteStepDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={title}
        first={position === 1}
        fields={stepFields(form, uid).length}
        onDelete={(mode) => {
          setConfirm(false);
          actions.removeStep(uid, mode);
        }}
      />
    </div>
  );
}
