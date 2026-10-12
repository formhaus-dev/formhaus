import { END, type BuilderOption } from '@formhaus/builder';
import { Select } from '../ui';
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
  return (
    <Select
      aria-label={`After ${name}, go to`}
      className={styles.goTo}
      value={option.jump ?? ''}
      disabled={readOnly}
      options={targets.map((target) => ({
        value: target.value,
        label: target.value === NEXT || target.value === END ? target.label : `Go to ${target.label}`,
      }))}
      onChange={(event) => {
        onChange(event.target.value);
      }}
    />
  );
}
