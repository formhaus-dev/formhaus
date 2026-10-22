import type { FieldComponentProps } from '../types';
import { fieldId } from './fieldProps';

export function HiddenField(props: FieldComponentProps) {
  return <input type="hidden" id={fieldId(props)} name={props.field.key} data-testid={props.testId} value={String(props.value ?? '')} />;
}
