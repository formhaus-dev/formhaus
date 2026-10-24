import { isActionDisabled } from '@formhaus/core';
import type { FormActionsProps } from '@formhaus/react';
import { Button, HStack } from '@chakra-ui/react';

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
    <HStack justify="space-between" mt="8" {...rootProps}>
      <HStack gap="2">
        {showBack && (
          <Button variant="outline" disabled={loading} onClick={onBack}>
            {backLabel}
          </Button>
        )}
        {cancelAction && (
          <Button variant="ghost" disabled={loading} onClick={onCancel}>
            {cancelAction.label}
          </Button>
        )}
        {showSkip && (
          <Button variant="ghost" disabled={loading} onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
      </HStack>
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
    </HStack>
  );
}
