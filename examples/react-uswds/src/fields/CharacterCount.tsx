import type { FieldProps } from '@formhaus/react';
import type { ControlRootProps } from '@formhaus/react/controls';
import { type ReactNode, useEffect, useState } from 'react';

const infoId = (f: FieldProps) => `${f.id}-info`;

export const counted = (f: FieldProps) =>
  f.maxLength ? { className: 'usa-character-count__field', 'aria-describedby': [infoId(f), f.describedBy].filter(Boolean).join(' ') } : {};

function status(length: number, max: number) {
  if (!length) return `${max} characters allowed`;
  const difference = Math.abs(max - length);
  return `${difference} character${difference === 1 ? '' : 's'} ${length > max ? 'over limit' : 'left'}`;
}

interface CharacterCountProps {
  f: FieldProps;
  max: number;
  rootProps: ControlRootProps;
  children: ReactNode;
}

export function CharacterCount({ f, max, rootProps, children }: CharacterCountProps) {
  const text = status(f.text.length, max);
  const [spoken, setSpoken] = useState(text);

  useEffect(() => {
    const timer = setTimeout(() => setSpoken(text), 1000);
    return () => clearTimeout(timer);
  }, [text]);

  return (
    <div {...rootProps} className="usa-character-count">
      {children}
      <span id={infoId(f)} className="usa-character-count__message usa-sr-only">
        You can enter up to {max} characters
      </span>
      <div
        className={
          f.text.length > max
            ? 'usa-character-count__status usa-hint usa-character-count__status--invalid'
            : 'usa-character-count__status usa-hint'
        }
        aria-hidden="true"
      >
        {text}
      </div>
      <div className="usa-character-count__sr-status usa-sr-only" aria-live="polite">
        {spoken}
      </div>
    </div>
  );
}
