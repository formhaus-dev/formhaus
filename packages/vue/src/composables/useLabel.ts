import type { LabelKey } from '@formhaus/core';
import { defaultFileLimit, type FileLimitMessage, labelFor } from '@formhaus/core/internal';
import { inject } from 'vue';

export const useLabel = () => inject('fhLabel', (key: LabelKey, params: Record<string, unknown> = {}) => labelFor(key, params));

export const useFileLimit = (): FileLimitMessage => inject('fhFileLimit', defaultFileLimit);
