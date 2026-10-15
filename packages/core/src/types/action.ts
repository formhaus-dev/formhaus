import type { ShowCondition } from './field';
import type { LabelI18n } from './i18n';

export interface FormAction {
  label: string;
  variant?: 'primary' | 'secondary' | 'text';
  disabled?: ShowCondition[];
  i18n?: LabelI18n;
}
