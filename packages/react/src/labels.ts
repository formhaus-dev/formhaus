import type { LabelKey } from '@formhaus/core';
import { labelFor } from '@formhaus/core/internal';
import { createContext } from 'react';

export type Label = (key: LabelKey, params?: Record<string, unknown>) => string;

export const LabelContext = createContext<Label>((key, params = {}) => labelFor(key, params));
