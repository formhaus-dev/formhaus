import { isActionDisabled } from '@formhaus/core';
import type { FormActionsProps } from '@formhaus/react';
import { Button, Group } from '@mantine/core';

export function FormActions({
  nextAction,
  submitAction,
  cancelAction,
  isMultiStep,
  isLastStep,
  primaryLabel,
  showPrimary = true,
  showBack,
  backLabel,
  showSkip,
  skipLabel,
  loading,
  values = {},
  onPrimary,
  onBack,
  onCancel,
  onSkip,
  rootProps,
}: FormActionsProps) {
  const primaryDisabled = isActionDisabled(isMultiStep && !isLastStep ? nextAction : submitAction, values);

  return (
    <Group justify="space-between" mt="xl" {...rootProps}>
      <Group gap="xs">
        {showBack && (
          <Button variant="default" disabled={loading} onClick={onBack}>
            {backLabel}
          </Button>
        )}
        {cancelAction && (
          <Button variant="subtle" disabled={loading} onClick={onCancel}>
            {cancelAction.label}
          </Button>
        )}
        {showSkip && (
          <Button variant="subtle" disabled={loading} onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
      </Group>
      {showPrimary && (
        <Button
          type="submit"
          loading={loading}
          disabled={primaryDisabled}
          onClick={(event) => {
            event.preventDefault();
            onPrimary?.();
          }}
        >
          {primaryLabel}
        </Button>
      )}
    </Group>
  );
}
