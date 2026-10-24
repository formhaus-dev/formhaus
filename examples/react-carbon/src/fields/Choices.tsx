import type { ControlOption } from '@formhaus/react/controls';
import { FormGroup, RadioButton, RadioButtonGroup, type RadioButtonGroupProps, RadioTile, Stack } from '@carbon/react';
import { Texts } from './GroupMessage';

interface ChoicesProps extends Omit<RadioButtonGroupProps, 'name' | 'value' | 'onChange' | 'legendText' | 'helperText' | 'required'> {
  'aria-required'?: boolean;
  id: string;
  name: string;
  value: unknown;
  legendText: string;
  helperText?: string;
  error?: string;
  describedBy?: string;
  options: ControlOption[];
  onChange: (value?: string | number) => void;
}

const optionId = (id: string, index: number) => (index ? `${id}-${index}` : id);

export function Choices({ id, value, options, error, describedBy, onChange, 'aria-required': _required, ...group }: ChoicesProps) {
  const selected = value == null ? undefined : String(value);
  if (options.some((option) => option.image))
    return (
      <FormGroup legendText={group.legendText} invalid={!!error} aria-invalid={!!error || undefined} disabled={group.disabled}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))', gap: '1rem' }}>
          {options.map((option, index) => (
            <RadioTile
              key={option.value}
              id={optionId(id, index)}
              name={group.name}
              value={String(option.value)}
              checked={selected === String(option.value)}
              disabled={group.disabled}
              aria-describedby={describedBy}
              onChange={onChange}
            >
              <Stack gap={3}>
                {option.image && <img src={option.image} alt="" width="100%" height={96} style={{ objectFit: 'cover' }} />}
                {option.label}
              </Stack>
            </RadioTile>
          ))}
        </div>
        <Texts id={id} helperText={group.helperText} error={error} />
      </FormGroup>
    );
  return (
    <RadioButtonGroup
      {...group}
      {...(error && { 'aria-describedby': `${id}-error` })}
      invalid={!!error}
      invalidText={<span id={`${id}-error`}>{error}</span>}
      valueSelected={selected}
      onChange={onChange}
    >
      {options.map((option, index) => (
        <RadioButton key={option.value} id={optionId(id, index)} value={String(option.value)} labelText={option.label} />
      ))}
    </RadioButtonGroup>
  );
}
