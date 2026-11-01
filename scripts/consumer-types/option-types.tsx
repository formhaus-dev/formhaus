import type { FieldOption } from '@formhaus/core';
import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';

type LibraryOption = { value: string | number; label: string; disabled?: boolean };

const toLibrary = (options: ControlOption[]): LibraryOption[] => options;

export const fromView = (props: FieldComponentProps) => toLibrary(fieldProps(props).options);
export const toField = (props: FieldComponentProps): FieldOption[] => fieldProps(props).options;
export const states = (options: ControlOption[]) =>
  options.map(({ label, image, exclusive, disabled }) => [label, image, exclusive, disabled === true]);
