import { isActionDisabled, type FormAction } from '@formhaus/core';
import { useContext } from 'react';
import { LabelContext } from './labels';
import type { FormActionsProps } from './types';

function buttonClass(action: FormAction | false | undefined, variant: NonNullable<FormAction['variant']>): string {
  return `fh-form-actions__button fh-form-actions__button--${(action && action.variant) || variant}`;
}

export function FormActions({
  submitAction,
  nextAction,
  backAction,
  cancelAction,
  skipAction,
  isFirstStep,
  isLastStep,
  isMultiStep,
  loading,
  showPrimary = true,
  values = {},
  onSubmit,
  onNext,
  onBack,
  onCancel,
  onSkip,
  primaryLabel: primaryLabelProp,
  showBack: showBackProp,
  backLabel: backLabelProp,
  showSkip: showSkipProp,
  skipLabel: skipLabelProp,
  onPrimary: onPrimaryProp,
  testIds,
  rootProps,
}: FormActionsProps) {
  const text = useContext(LabelContext);
  const showBack = showBackProp ?? (isMultiStep && !isFirstStep && backAction !== false);
  const backLabel = backLabelProp ?? (backAction || undefined)?.label ?? text('back');
  const showSkip = showSkipProp ?? (isMultiStep && !!skipAction);
  const skipLabel = skipLabelProp ?? skipAction?.label ?? text('skip');
  const next = isMultiStep && !isLastStep;
  const primaryLabel = primaryLabelProp ?? (next ? text('continue') : (submitAction?.label ?? text('submit')));

  const primaryDisabled = !!loading || isActionDisabled(next ? nextAction : submitAction, values);

  const handlePrimary = onPrimaryProp ?? (next ? onNext : onSubmit);

  return (
    <div className="fh-form-actions" {...rootProps}>
      <div className="fh-form-actions__secondary">
        {showBack && (
          <button
            type="button"
            className={buttonClass(backAction, 'secondary')}
            disabled={loading}
            onClick={onBack}
            data-testid={testIds?.back}
          >
            {backLabel}
          </button>
        )}
        {cancelAction && (
          <button type="button" className={buttonClass(cancelAction, 'text')} disabled={loading} onClick={onCancel}>
            {cancelAction.label}
          </button>
        )}
        {showSkip && (
          <button type="button" className={buttonClass(skipAction, 'text')} disabled={loading} onClick={onSkip}>
            {skipLabel}
          </button>
        )}
      </div>
      {showPrimary && (
        <button
          type="submit"
          className="fh-form-actions__button fh-form-actions__button--primary"
          disabled={primaryDisabled}
          aria-busy={loading}
          data-testid={testIds?.[next ? 'next' : 'submit']}
          onClick={(event) => {
            event.preventDefault();
            handlePrimary();
          }}
        >
          {primaryLabel}
        </button>
      )}
    </div>
  );
}
