import { Search } from 'lucide-react';
import type { ComponentPropsWithRef } from 'react';
import { cx } from '../../lib/cx';
import control from '../../styles/control.module.css';
import { useFieldControl } from '../Field/context';
import styles from './Input.module.css';

export type InputProps = ComponentPropsWithRef<'input'> & { mono?: boolean };

export function Input({ className, mono = false, type = 'text', ...props }: InputProps) {
  const wired = useFieldControl(props);
  return <input type={type} className={cx(control.control, mono && styles.mono, className)} {...wired} />;
}

export type SearchInputProps = Omit<InputProps, 'type'>;

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <span className={cx(styles.search, className)}>
      <Search aria-hidden className={styles.icon} />
      <Input type="search" className={styles.searchInput} {...props} />
    </span>
  );
}
