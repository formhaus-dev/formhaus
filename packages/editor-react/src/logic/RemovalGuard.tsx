import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '../ui';
import { GuardContext, type Ask } from './guard';

interface Pending {
  label: string;
  count: number;
  resolve: (ok: boolean) => void;
}

export function RemovalGuardProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const ask = useCallback<Ask>(
    (label, count) =>
      new Promise((resolve) => {
        setPending({ label, count, resolve });
      }),
    [],
  );
  const many = (pending?.count ?? 0) > 1;
  return (
    <GuardContext value={ask}>
      {children}
      <ConfirmDialog
        open={!!pending}
        title={`Delete ${pending?.label ?? 'this field'}?`}
        description={`It is used in ${String(pending?.count ?? 0)} condition${many ? 's' : ''}. Deleting the field removes ${many ? 'them' : 'it'} too. You can undo this.`}
        confirmLabel="Delete field"
        onOpenChange={(open) => {
          if (open) return;
          pending?.resolve(false);
          setPending(null);
        }}
        onConfirm={() => {
          pending?.resolve(true);
          setPending(null);
          return undefined;
        }}
      />
    </GuardContext>
  );
}
