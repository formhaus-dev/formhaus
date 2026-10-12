import type { FormDefinition } from '@formhaus/core';
import type { ComponentType } from 'react';

export interface Published {
  definition: FormDefinition;
  version: number;
}

export interface SavedDraft {
  definition: FormDefinition;
  revision: number;
  baseVersion: number | null;
  savedAt: string;
  savedBy: string;
}

export interface EditorDocument {
  draft: SavedDraft | null;
  published: Published | null;
}

export interface PublishResult {
  formId: string;
  version: number;
  warnings: string[];
}

export interface ServerProblem {
  path: string;
  message: string;
}

export interface Notice {
  title: string;
  description?: string;
  tone?: 'neutral' | 'success' | 'danger';
  action?: { label: string; onClick: () => void };
}

export class SaveConflict extends Error {
  readonly remote: SavedDraft;

  constructor(remote: SavedDraft) {
    super('save_conflict');
    this.name = 'SaveConflict';
    this.remote = remote;
  }
}

export class StaleBase extends Error {
  readonly latest: number;

  constructor(latest: number) {
    super('stale_base');
    this.name = 'StaleBase';
    this.latest = latest;
  }
}

export class PublishRejected extends Error {
  readonly problems: ServerProblem[];

  constructor(problems: ServerProblem[]) {
    super('publish_rejected');
    this.name = 'PublishRejected';
    this.problems = problems;
  }
}

export class PublishRefused extends Error {
  readonly notice: Notice;

  constructor(notice: Notice) {
    super(notice.title);
    this.name = 'PublishRefused';
    this.notice = notice;
  }
}

export interface BackupBase {
  version: number | null;
  draft: string | null;
}

export interface BackupSlot {
  key: () => string;
  mirror: boolean;
  base: () => BackupBase;
}

export interface EditorHost {
  readonly isNew: boolean;
  readonly readOnly: boolean;
  readonly ephemeral?: boolean;
  backup?: BackupSlot;
  load: () => Promise<EditorDocument>;
  save: (definition: FormDefinition, revision: number) => Promise<SavedDraft>;
  discard: () => Promise<void>;
  stored: () => boolean;
  publish?: (revision: number, overwrite: boolean) => Promise<PublishResult>;
  onPublished?: (result: PublishResult) => void;
  onDiscarded?: () => void;
  onTitle?: (title: string | null) => void;
  notify: (notice: Notice) => void;
  describeError: (error: unknown) => string;
  ago: (iso: string) => string;
  savedHint?: string;
  Preview: ComponentType<{ definition: FormDefinition }>;
}
