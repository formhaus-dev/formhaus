import type { FormEngine, LabelKey, LabelSource } from '@formhaus/core';
import { defaultFileLimit, engineLabel, type FileLimitMessage, labelFor } from '@formhaus/core/internal';
import { createContext, useMemo } from 'react';

export type Label = (key: LabelKey, params?: Record<string, unknown>) => string;

export const LabelContext = /* @__PURE__ */ createContext<Label>((key, params = {}) => labelFor(key, params));

export const FileLimitContext = /* @__PURE__ */ createContext<FileLimitMessage>(defaultFileLimit);

export function useEngineLabel(engine: FormEngine, labels: LabelSource | undefined, locale: unknown): Label {
  return useMemo(
    () =>
      (key, params = {}) =>
        engineLabel(engine, key, params, labels),
    [engine, engine.definition, labels, locale],
  );
}
