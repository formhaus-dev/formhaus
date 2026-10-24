import type { FieldProps } from '@formhaus/react';

export const label = (f: FieldProps) => (f.required ? `${f.label} *` : f.label);

export const texts = (f: FieldProps) => ({ helperText: f.helperText, invalid: f.invalid, invalidText: f.error });

export const labels = (f: FieldProps) => ({ labelText: label(f), ...texts(f) });
