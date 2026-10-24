import type { ControlOption } from '@formhaus/react/controls';
import { type ComponentProps, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SelectControlProps = Omit<ComponentProps<typeof SelectTrigger>, 'value' | 'onChange' | 'onBlur'> & {
  options: ControlOption[];
  value: string;
  name?: string;
  placeholder?: string;
  onChange: (value: unknown) => void;
  onBlur: () => void;
};

export function SelectControl({ options, value, name, placeholder, disabled, onChange, onBlur, ...trigger }: SelectControlProps) {
  const [open, setOpen] = useState(false);
  return (
    <Select
      items={options}
      value={value || null}
      name={name}
      disabled={disabled}
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onBlur();
      }}
      onValueChange={(next) => onChange(next ?? '')}
    >
      <SelectTrigger {...trigger} className="w-full" onBlur={() => !open && onBlur()}>
        <SelectValue placeholder={placeholder ?? 'Select...'} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
