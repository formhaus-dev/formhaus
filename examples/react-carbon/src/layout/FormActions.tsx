import { isActionDisabled } from '@formhaus/core';
import type { FormActionsProps } from '@formhaus/react';
import { ArrowRight } from '@carbon/icons-react';
import { Button, ButtonSet } from '@carbon/react';

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
  const primaryDisabled = !!loading || isActionDisabled(isMultiStep && !isLastStep ? nextAction : submitAction, values);

  return (
    <ButtonSet style={{ marginBlockStart: '2rem', justifyContent: isMultiStep ? 'flex-end' : undefined }} {...rootProps}>
      {cancelAction && (
        <Button kind="ghost" disabled={loading} onClick={onCancel}>
          {cancelAction.label}
        </Button>
      )}
      {showSkip && (
        <Button kind="ghost" disabled={loading} onClick={onSkip}>
          {skipLabel}
        </Button>
      )}
      {showBack && (
        <Button kind="secondary" disabled={loading} onClick={onBack}>
          {backLabel}
        </Button>
      )}
      {showPrimary && (
        <Button
          type="submit"
          kind="primary"
          renderIcon={ArrowRight}
          disabled={primaryDisabled}
          onClick={(event) => {
            event.preventDefault();
            onPrimary?.();
          }}
        >
          {primaryLabel}
        </Button>
      )}
    </ButtonSet>
  );
}
