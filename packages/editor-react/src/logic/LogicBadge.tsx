import { logicOf, scopeOf, type BuilderBlock, type BuilderForm, type BuilderQuestion } from '@formhaus/builder';
import { Eye } from 'lucide-react';
import { useCallback } from 'react';
import { useEditor } from '../store/context';
import { describeLogic, sourceOf } from './describe';
import styles from './Logic.module.css';

interface Described {
  sources: (BuilderQuestion | undefined)[];
  text: string | null;
}

const described = new WeakMap<object, Described>();

function logicText(form: BuilderForm, block: BuilderBlock): string | null {
  const conditions = [...(block.extra.show ?? []), ...(block.extra.showAny ?? [])];
  const scope = scopeOf(form, block);
  const sources = conditions.map((condition) => sourceOf(form, condition.field, scope));
  const known = described.get(block.extra);
  if (known?.sources.length === sources.length && known.sources.every((source, index) => source === sources[index])) return known.text;
  const text = describeLogic(form, logicOf(form, block), scope);
  described.set(block.extra, { sources, text });
  return text;
}

export function LogicBadge({ block, onOpen }: { block: BuilderBlock; onOpen: () => void }) {
  const text = useEditor(useCallback((state) => logicText(state.form, block), [block]));
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
