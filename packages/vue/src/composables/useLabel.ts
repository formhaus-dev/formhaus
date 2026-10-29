import type { LabelKey } from '@formhaus/core';
import { defaultFileText, type FileText } from '@formhaus/core/fields';
import { labelFor } from '@formhaus/core/internal';
import { inject } from 'vue';

export const useLabel = () => inject('fhLabel', (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params));

export const useFileText = (): FileText => inject('fhFileText', defaultFileText);
