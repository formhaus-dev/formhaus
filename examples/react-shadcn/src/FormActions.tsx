import type { FormActionsProps } from '@formhaus/react';
import { Button } from '@/components/ui/button';

export function FormActions({
  primaryLabel,
  showPrimary = true,
  showBack,
  backLabel,
  loading,
  onPrimary,
  onPrev,
}: FormActionsProps) {
  return (
    <div className="flex justify-between gap-2 pt-2">
      {showBack ? (
        <Button type="button" variant="outline" disabled={loading} onClick={onPrev}>
          {backLabel}
        </Button>
      ) : (
        <span />
      )}
      {showPrimary && (
        <Button type="button" disabled={loading} onClick={onPrimary}>
          {primaryLabel}
        </Button>
      )}
    </div>
  );
}
