import type { FieldComponentProps } from '@formhaus/react';
import { FormGroup, Toggle } from '@carbon/react';
import { groupProps, inputProps } from './shared';
import { GroupMessage } from './GroupMessage';

export function SwitchField(props: FieldComponentProps) {
  const { value, onChange } = props;
  const { id, labelText, disabled, onBlur, onFocus } = inputProps(props);

  return (
    <FormGroup {...groupProps(props)} legendText="">
      <Toggle
        id={id}
        labelText={labelText}
        labelA="Off"
        labelB="On"
        disabled={disabled}
        toggled={value === true}
        onToggle={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
      />
      <GroupMessage error={props.error} helper={props.field.helperText} />
    </FormGroup>
  );
}
