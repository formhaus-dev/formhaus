import type { ControlOption } from '@formhaus/react/controls';
import type { ComponentProps } from 'react';
import { Input } from '@/components/ui/input';

export function AutocompleteInput({ options, ...input }: ComponentProps<typeof Input> & { options: ControlOption[] }) {
  const list = `${input.id}-list`;
  return (
    <>
      <Input {...input} list={list} autoComplete={input.autoComplete ?? 'off'} />
      <datalist id={list}>
        {options.map((option) => (
          <option key={option.value} value={option.label} />
        ))}
      </datalist>
    </>
  );
}
