import type { FieldOption, FormField } from '@formhaus/core';
import { type FieldComponentProps, fieldProps } from '@formhaus/react';
import type { ControlOption } from '@formhaus/react/controls';

type LibraryOption = { value: string | number; label: string; disabled?: boolean };

const toLibrary = (options: ControlOption[]): LibraryOption[] => options;

export const fromView = (props: FieldComponentProps) => toLibrary(fieldProps(props).options);
export const fromField = (field: FormField) => toLibrary(field.options ?? []);
export const fromList = (options: FieldOption[]) => toLibrary(options).map((option) => option.label);
export const labels = (options: ControlOption[]) => options.map(({ label, image, exclusive }) => [label, image, exclusive]);
