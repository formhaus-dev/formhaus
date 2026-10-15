import type { FormDefinition } from '@formhaus/core';
import type { ComponentType } from 'react';
import type { EditorFeatures, EditorHost, Notice, SavedDraft } from '../host';
import { formatAgo } from '../ui/lib/format';

export interface HostOptions {
  Preview: ComponentType<{ definition: FormDefinition }>;
  notify?: (notice: Notice) => void;
  onTitle?: (title: string | null) => void;
  onChange?: (definition: FormDefinition) => void;
  definition?: FormDefinition;
  savedHint?: string;
  features?: EditorFeatures;
}

export const savedDraft = (definition: FormDefinition, revision: number): SavedDraft => ({
  definition,
  revision,
  baseVersion: null,
  savedAt: new Date().toISOString(),
  savedBy: '',
});

export function baseHost({
  Preview,
  notify = () => undefined,
  onTitle,
  savedHint,
  features,
}: Omit<HostOptions, 'onChange' | 'definition'>) {
  return {
    isNew: true,
    readOnly: false,
    notify,
    describeError: (error: unknown) => (error instanceof Error ? error.message : String(error)),
    ago: (iso: string) => formatAgo(iso),
    Preview,
    ...(onTitle ? { onTitle } : {}),
    ...(savedHint ? { savedHint } : {}),
    ...(features ? { features } : {}),
  } satisfies Partial<EditorHost>;
}
