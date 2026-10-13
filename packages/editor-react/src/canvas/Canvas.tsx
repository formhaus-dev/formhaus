import { groups, isPage } from '@formhaus/builder';
import { useEditorStore } from '../store/context';
import { useForm } from '../store/hooks';
import type { EditorActions } from '../useEditorActions';
import styles from './Canvas.module.css';
import { FormHeaderCard } from './FormHeaderCard';
import { StepSection } from './StepSection';

interface Props {
  actions: EditorActions;
  header?: boolean;
}

export function Canvas({ actions, header = true }: Props) {
  const form = useForm();
  const store = useEditorStore();
  const parts = groups(form);
  const stepped = form.blocks.some(isPage);
  return (
    <div
      className={styles.canvas}
      onClick={(event) => {
        if (event.target === event.currentTarget) store.select(null);
      }}
    >
      {header && <FormHeaderCard actions={actions} />}
      {(parts.length ? parts : [{ questions: [] }]).map((part, index) => (
        <StepSection
          key={part.page?.uid ?? 'root'}
          step={part.page?.uid ?? null}
          page={part.page ?? null}
          last={index === Math.max(parts.length, 1) - 1}
          first={index === 0}
          fields={part.questions}
          header={stepped ? { position: index + 1, total: parts.length } : null}
          actions={actions}
        />
      ))}
    </div>
  );
}
