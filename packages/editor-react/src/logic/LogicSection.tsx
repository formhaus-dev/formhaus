import { conditionSources, logicOf, setLogic, type BuilderBlock, type ConditionMode, type ConditionRow } from '@formhaus/builder';
import { AddRow, Select, Text } from '../ui';
import { useForm, useReadOnly } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import { ConditionEditor } from './ConditionEditor';
import { defaultRow } from './rows';
import styles from './Logic.module.css';

export function LogicSection({ block, actions }: { block: BuilderBlock; actions: EditorActions }) {
  const form = useForm();
  const readOnly = useReadOnly();
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
  return (
    <section className={styles.section} aria-label="Logic">
      <span className={styles.title}>Logic</span>
      {!logic.editable ? (
        <Text size="sm" tone="muted">
          This {noun} uses conditions the editor cannot show. Edit them in the JSON tab.
        </Text>
      ) : !sources.length ? (
        <Text size="sm" tone="muted">
          Add a field before this {noun} to show it only for some answers.
        </Text>
      ) : (
        <>
          <Select
            aria-label={`Show this ${noun}`}
            value={logic.mode}
            disabled={readOnly}
            options={[
              { value: 'always', label: 'Always show' },
              { value: 'all', label: 'Show when all match' },
              { value: 'any', label: 'Show when any matches' },
            ]}
            onChange={(event) => {
              const mode = event.target.value as ConditionMode;
              write(mode, mode === 'always' ? [] : logic.rows.length ? logic.rows : fresh());
            }}
          />
          {logic.mode !== 'always' &&
            logic.rows.map((row, index) => (
              <ConditionEditor
                key={index}
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
          {logic.mode !== 'always' && !readOnly && (
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
    </section>
  );
}
