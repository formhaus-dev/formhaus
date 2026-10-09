import type { FormField } from '@formhaus/core';
import type { KitTheme } from '../kits/kit';

export interface FormRenderer {
  theme: KitTheme;
  field(field: FormField): Promise<SceneNode>;
  button(label: string, primary: boolean): Promise<SceneNode | null>;
}

export function labelText(field: FormField): string {
  return field.validation?.required ? `${field.label} *` : field.label;
}
