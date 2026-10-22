import { conditionSources, logicOf, setLogic, type BuilderBlock, type ConditionMode, type ConditionRow } from '@formhaus/builder';
import { Eye } from 'lucide-react';
import { useId } from 'react';
import { SettingsSection } from '../inspector/SettingsSection';
import { AddRow, Button, SegmentedControl, Text } from '../ui';
import { useForm, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import { ConditionEditor } from './ConditionEditor';
import { defaultRow } from './rows';
import styles from './Logic.module.css';

const MATCH = [
  { value: 'all', label: 'all' },
  { value: 'any', label: 'any' },
];

export function LogicSection({ block, actions }: { block: BuilderBlock; actions: EditorActions }) {
  const form = useForm();
  const readOnly = useReadOnly();
  const hint = useId();
  const logic = logicOf(form, block);
  const sources = conditionSources(form, block.uid);
  const noun = block.kind === 'page' ? 'step' : 'field';
  const write = (mode: ConditionMode, rows: ConditionRow[]) => {
    actions.edit((draft) => {
      setLogic(draft, block.uid, mode, rows);
    }, `${block.uid}:logic`);
  };
  const fresh = () => {
    const source = sources.at(-1);
    return source ? [defaultRow(source)] : [];
  };
  const shown = logic.mode === 'always' || !logic.rows.length;
  return (
    <SettingsSection title="Logic">
      <div className={styles.section}>
        {!logic.editable ? (
          <Text size="sm" tone="muted">
            This {noun} uses conditions the editor cannot show. Edit them in the JSON tab.
          </Text>
        ) : shown ? (
          <>
            <div className={styles.entry}>
              <Text size="sm" tone="muted">
                Always shown
              </Text>
              <Button
                variant={sources.length ? 'secondary' : 'ghost'}
                icon={<Eye aria-hidden />}
                disabled={readOnly || !sources.length}
                aria-describedby={sources.length ? undefined : hint}
                onClick={() => {
                  write('all', fresh());
                }}
              >
                Show only if…
              </Button>
            </div>
            {!sources.length && (
              <Text as="p" id={hint} size="sm" tone="muted">
                {block.kind === 'page' ? 'No earlier steps' : 'No fields above'}
              </Text>
            )}
          </>
        ) : (
          <>
            <div className={styles.entry}>
              <Text size="sm">Show when</Text>
              {logic.rows.length > 1 && (
                <>
                  <SegmentedControl
                    label="Match"
                    options={MATCH.map((option) => ({ ...option, disabled: readOnly }))}
                    value={logic.mode}
                    onValueChange={(mode) => {
                      write(mode as ConditionMode, logic.rows);
                    }}
                  />
                  <Text size="sm">match</Text>
                </>
              )}
            </div>
            {logic.rows.map((row, index) => (
              <ConditionEditor
                key={index}
                index={index}
                row={row}
                sources={sources}
                readOnly={readOnly}
                onChange={(next) => {
                  write(
                    logic.mode,
                    logic.rows.map((item, at) => (at === index ? next : item)),
                  );
                }}
                onRemove={() => {
                  const rest = logic.rows.filter((_, at) => at !== index);
                  write(rest.length ? logic.mode : 'always', rest);
                }}
              />
            ))}
            {!readOnly && (
              <AddRow
                label="Add condition"
                inset="flush"
                onClick={() => {
                  write(logic.mode, [...logic.rows, ...fresh()]);
                }}
              />
            )}
          </>
        )}
      </div>
    </SettingsSection>
  );
}
