import type { FormEngine, LabelKey, LabelSource } from '@formhaus/core';
import { defaultFileLimit, engineFileLimit, engineLabel, type FileLimitMessage, labelFor } from '@formhaus/core/internal';
import { createContext, createElement, type ReactNode, useMemo } from 'react';

export type Label = (key: LabelKey, params?: Record<string, unknown>) => string;

export const LabelContext = /* @__PURE__ */ createContext<Label>((key, params = {}) => labelFor(key, params));

export const FileLimitContext = /* @__PURE__ */ createContext<FileLimitMessage>(defaultFileLimit);

function useEngineLabel(engine: FormEngine, labels: LabelSource | undefined, locale: unknown): Label {
  return useMemo(
    () =>
      (key, params = {}) =>
        engineLabel(engine, key, params, labels),
    [engine, engine.definition, labels, locale],
  );
}

interface TextContextsProps {
  engine: FormEngine;
  labels: LabelSource | undefined;
  locale: unknown;
  children: ReactNode;
}

export function TextContexts({ engine, labels, locale, children }: TextContextsProps) {
  const label = useEngineLabel(engine, labels, locale);
  const limit = useMemo(() => engineFileLimit(engine), [engine]);
  return createElement(LabelContext.Provider, { value: label }, createElement(FileLimitContext.Provider, { value: limit }, children));
}
