import { logicOf, type BuilderBlock } from '@formhaus/builder';
import { Eye } from 'lucide-react';
import { useForm } from '../store/hooks';
import { describeLogic } from './describe';
import styles from './Logic.module.css';

export function LogicBadge({ block, onOpen }: { block: BuilderBlock; onOpen: () => void }) {
  const form = useForm();
  const text = describeLogic(form, logicOf(form, block));
  if (!text) return null;
  return (
    <button
      type="button"
      className={styles.badge}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      <Eye aria-hidden />
      {text}
    </button>
  );
}
