import { hasOptions, inferType, isMatrix, setFieldType } from '@formhaus/builder';
import { CircleAlert, Settings2 } from 'lucide-react';
import { useId, useLayoutEffect, useRef } from 'react';
import { IconButton, SortableHandle, type SortableHandleProps } from '../ui';
import { cx } from '../ui/lib/cx';
import { typeIcon, typeLabel } from '../fieldTypes';
import { FieldPanel } from '../inspector/FieldPanel';
import settings from '../inspector/Inspector.module.css';
import { LogicBadge } from '../logic/LogicBadge';
import { keyHint } from '../shell/keys';
import { useEditorStore } from '../store/context';
import { useErrors, useField, useIsExpanded, useIsMatrixRow, useIsSelected, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './FieldCard.module.css';
import suggestionStyles from './TypeSuggestion.module.css';
import { HelpText, PlaceholderInput } from './FieldDetails';
import { HiddenValue } from './HiddenValue';
import { MatrixPreview } from './MatrixPreview';
import { takesPlaceholder } from './placeholder';
import { FieldLabel } from './FieldLabel';
import { FieldMenu } from './FieldMenu';
import { FieldPreview } from './FieldPreview';
import { focusCard, useFocusRequests } from './focus';
import { OptionsEditor } from './OptionsEditor';
import { questionName } from './questionName';
import { RequiredTag } from './RequiredTag';
import { takesRequired } from './required';
import { TypeChip } from './TypeChip';
import { useCardKeys } from './useCardKeys';
import { closeSettingsOnEscape, toggleSettings } from './settings';

interface Props {
  uid: string;
  handleProps: SortableHandleProps;
  actions: EditorActions;
}

export function FieldCard({ uid, handleProps, actions }: Props) {
  const field = useField(uid);
  const store = useEditorStore();
  const selected = useIsSelected({ kind: 'field', uid });
  const expanded = useIsExpanded(uid);
  const readOnly = useReadOnly();
  const issues = useErrors(uid);
  const focus = useFocusRequests();
  const issuesId = useId();
  const label = useRef<HTMLTextAreaElement>(null);
  const onCardKey = useCardKeys(uid, actions);
  const row = useIsMatrixRow(uid);

  useLayoutEffect(() => {
    const target = focus.take(uid);
    if (target) focusCard(uid, target);
  });

  if (!field) return null;
  const select = () => {
    if (!selected) store.select({ kind: 'field', uid });
  };
  const addBelow = () => {
    const created = actions.addField({ after: uid });
    if (created) focus.request(created, 'label');
  };
  const suggestion = field.type === 'text' && !readOnly ? inferType(field.label) : undefined;
  const choice = hasOptions(field.type);
  const container = field.type === 'section' || field.type === 'group';
  const body = () => {
    if (container) return isMatrix(field) ? <MatrixPreview field={field} /> : null;
    if (row && !selected) return null;
    if (selected && choice && !readOnly) return <OptionsEditor field={field} actions={actions} />;
    if (selected && !readOnly && takesPlaceholder(field)) return <PlaceholderInput field={field} actions={actions} readOnly={readOnly} />;
    if (selected && !readOnly && field.type === 'hidden') return <HiddenValue field={field} actions={actions} />;
    return <FieldPreview field={field} />;
  };

  return (
    <div
      data-card={uid}
      className={cx(styles.card, selected && styles.selected, issues.length > 0 && styles.invalid)}
      tabIndex={selected ? 0 : -1}
      role="group"
      aria-label={`${questionName(field)} ${container ? typeLabel(field.type).toLowerCase() : 'field'}`}
      aria-describedby={issues.length ? issuesId : undefined}
      onClick={select}
      onKeyDown={(event) => {
        onCardKey(event, false);
      }}
    >
      {!readOnly && <SortableHandle {...handleProps} className={styles.handle} />}
      <div className={styles.body}>
        <div className={styles.head}>
          <div className={styles.title}>
            <FieldLabel
              field={field}
              actions={actions}
              readOnly={readOnly}
              inputRef={label}
              onSelect={select}
              onAddBelow={addBelow}
              onCardKey={onCardKey}
            />
            {takesRequired(field) && <RequiredTag field={field} actions={actions} editable={selected && !readOnly} reserve={!readOnly} />}
          </div>
          <TypeChip field={field} actions={actions} disabled={readOnly || container} />
          {!readOnly && (
            <>
              <IconButton
                label="Field settings"
                shortcut={keyHint('.')}
                aria-expanded={expanded}
                data-settings-toggle={uid}
                className={cx(styles.settings, expanded && styles.on)}
                icon={<Settings2 aria-hidden />}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSettings(store, uid, expanded);
                }}
              />
              <FieldMenu
                uid={uid}
                actions={actions}
                onAddBelow={addBelow}
                onSettings={() => {
                  toggleSettings(store, uid, expanded);
                }}
              />
            </>
          )}
        </div>
        {suggestion && suggestion !== 'text' && (
          <button
            type="button"
            className={suggestionStyles.suggestion}
            onClick={() => {
              actions.edit((form) => {
                setFieldType(form, uid, suggestion);
              });
            }}
          >
            {typeIcon(suggestion)}
            Switch to {typeLabel(suggestion)}
          </button>
        )}
        {field.type !== 'hidden' && <HelpText field={field} actions={actions} readOnly={readOnly} selected={selected} />}
        <LogicBadge
          block={field}
          onOpen={() => {
            toggleSettings(store, uid, false);
          }}
        />
        {body()}
        {issues.length > 0 && (
          <ul id={issuesId} className={styles.issues}>
            {issues.map((message) => (
              <li key={message} className={cx(styles.issue, styles.error)}>
                <CircleAlert aria-hidden />
                {message}
              </li>
            ))}
          </ul>
        )}
        {expanded && (
          <div className={settings.settings} data-settings={uid} onKeyDown={closeSettingsOnEscape(store, uid)}>
            <FieldPanel field={field} actions={actions} />
          </div>
        )}
      </div>
    </div>
  );
}
