import type { FormEngine, LabelKey, LabelSource } from '@formhaus/core';
import { defaultFileText, type FileText } from '@formhaus/core/fields';
import { engineLabel, fileLimitMessage, labelFor } from '@formhaus/core/internal';
import { createContext, createElement, type ReactNode, useContext, useMemo } from 'react';

export type Label = (key: LabelKey, params?: Record<string, unknown>) => string;

export const LabelContext = /* @__PURE__ */ createContext<Label>((key, params = {}) => labelFor(key, params));

const FileTextContext = /* @__PURE__ */ createContext<FileText>(defaultFileText);

export const useFileText = (): FileText => useContext(FileTextContext);

interface TextContextsProps {
  engine: FormEngine;
  labels: LabelSource | undefined;
  locale: unknown;
  children: ReactNode;
}

export function TextContexts({ engine, labels, locale, children }: TextContextsProps) {
  const label = useMemo<Label>(
    () =>
      (key, params = {}) =>
        engineLabel(engine, key, params, labels),
    [engine, engine.definition, labels, locale],
  );
  const text = useMemo<FileText>(() => ({ label, limit: (field, max) => fileLimitMessage(engine, field, max) }), [label, engine]);
  return createElement(LabelContext.Provider, { value: label }, createElement(FileTextContext.Provider, { value: text }, children));
}
