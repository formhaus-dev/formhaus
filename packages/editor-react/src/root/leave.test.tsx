import type { FormDefinition } from '@formhaus/core';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { EditorRoot } from '../EditorRoot';
import { backupKey, createLocalHost, LOCAL_KEY } from '../hosts/localHost';
import { createMemoryHost } from '../hosts/memoryHost';
import { readBackup, writeBackup } from '../store/backup';
import { confirmLeave, hasUnsavedChanges } from '../store/leave';

const Preview = () => null;
const definition: FormDefinition = { id: 'contact', title: 'Contact', submit: { label: 'Send' }, fields: [{ key: 'email', type: 'email', label: 'Email' }] };
const carried: FormDefinition = { ...definition, fields: [{ key: 'email', type: 'email', label: 'Work email' }] };

function failingStorage(): Storage {
  return {
    getItem: (key: string) => localStorage.getItem(key),
    setItem: () => {
      throw new DOMException('full', 'QuotaExceededError');
    },
    removeItem: (key: string) => {
      localStorage.removeItem(key);
    },
  } as unknown as Storage;
}

describe('restore offer', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('offers a newer copy and loads it on Restore', async () => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ definition, revision: 2, savedAt: '2026-10-12T10:00:00Z' }));
    writeBackup(backupKey(LOCAL_KEY), { definition: carried, revision: 2, at: new Date().toISOString() });
    render(<EditorRoot host={createLocalHost({ Preview })} />);
    expect(await screen.findByText(/^Restore unsaved changes from .+\?$/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Email')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }));
    expect(await screen.findByDisplayValue('Work email')).toBeInTheDocument();
    expect(screen.queryByText(/Restore unsaved changes/)).toBeNull();
  });

  it('drops the copy on Discard', async () => {
    writeBackup(backupKey(LOCAL_KEY), { definition: carried, revision: 0, at: new Date().toISOString() });
    render(<EditorRoot host={createLocalHost({ Preview, definition })} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(screen.getByDisplayValue('Email')).toBeInTheDocument();
    expect(readBackup(backupKey(LOCAL_KEY))).toBeNull();
  });

  it('stays quiet without a copy', async () => {
    render(<EditorRoot host={createLocalHost({ Preview, definition })} />);
    await screen.findByDisplayValue('Email');
    expect(screen.queryByText(/Restore unsaved changes/)).toBeNull();
  });
});

describe('leave guard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('lets the page go once everything is saved', async () => {
    render(<EditorRoot host={createLocalHost({ Preview, definition })} />);
    const label = await screen.findByDisplayValue('Email');
    await userEvent.type(label, 'x');
    expect(hasUnsavedChanges()).toBe(true);
    let leave = false;
    await act(async () => {
      leave = await confirmLeave();
    });
    expect(leave).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('asks before leaving when the save fails', async () => {
    render(<EditorRoot host={createLocalHost({ Preview, definition, storage: failingStorage() })} />);
    await userEvent.type(await screen.findByDisplayValue('Email'), 'x');
    let answer: Promise<boolean> = Promise.resolve(true);
    await act(async () => {
      answer = confirmLeave();
      await Promise.resolve();
    });
    expect(await screen.findByRole('dialog', { name: 'Leave without saving?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(await answer).toBe(false);
    act(() => {
      answer = confirmLeave();
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Leave' }));
    expect(await answer).toBe(true);
  });

  it('never guards the in-memory demo', async () => {
    render(<EditorRoot host={createMemoryHost({ Preview, definition })} />);
    await userEvent.type(await screen.findByDisplayValue('Email'), 'x');
    expect(hasUnsavedChanges()).toBe(false);
  });
});
