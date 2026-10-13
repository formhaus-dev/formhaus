import { type BuilderOption } from '@formhaus/builder';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui';
import { cx } from '../ui/lib/cx';
import { NEXT, type Target } from '../logic/targets';
import styles from './OptionsEditor.module.css';

interface Props {
  option: BuilderOption;
  name: string;
  targets: Target[];
  readOnly: boolean;
  onChange: (target: string) => void;
}

export function GoTo({ option, name, targets, readOnly, onChange }: Props) {
  const value = option.jump ?? NEXT;
  const current = targets.find((target) => target.value === value) ?? targets[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button type="button" className={cx(styles.goTo, value === NEXT && styles.next)} disabled={readOnly} aria-label={`After ${name}, go to: ${current?.label ?? ''}`}>
          <ArrowRight aria-hidden />
          <span>{current?.label}</span>
          {!readOnly && <ChevronDown aria-hidden className={styles.chevron} />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {targets.map((target) => (
          <DropdownMenuItem
            key={target.value}
            checked={target.value === value}
            onSelect={() => {
              onChange(target.value);
            }}
          >
            {target.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
