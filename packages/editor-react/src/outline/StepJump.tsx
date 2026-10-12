import { groups, pageTitle } from '@formhaus/builder';
import { Select } from '../ui';
import { focusCard } from '../canvas/focus';
import { useEditorStore } from '../store/context';
import { useForm, useSelection, useStepOf } from '../store/hooks';
import styles from './StepOutline.module.css';

export function StepJump() {
  const form = useForm();
  const store = useEditorStore();
  const active = useStepOf(useSelection());
  const pages = groups(form).flatMap((part, index) => (part.page ? [{ part, page: part.page, index }] : []));
  if (pages.length < 2) return null;
  return (
    <div className={styles.jump}>
      <Select
        aria-label="Jump to step"
        value={active ?? ''}
        options={[
          { value: '', label: `${String(pages.length)} steps · jump to a step`, disabled: true },
          ...pages.map(({ page, index }) => ({
            value: page.uid,
            label: `Step ${String(index + 1)} of ${String(pages.length)} · ${pageTitle(page, index)}`,
          })),
        ]}
        onChange={(event) => {
          const uid = event.target.value;
          store.select({ kind: 'step', uid });
          requestAnimationFrame(() => {
            focusCard(uid);
          });
        }}
      />
    </div>
  );
}
