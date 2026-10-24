import type { FormStepProgressProps } from '@formhaus/react';
import { useSyncExternalStore } from 'react';
import { Heading, ProgressBar, ProgressIndicator, ProgressStep, Section, Stack } from '@carbon/react';

const narrowQuery = window.matchMedia('(max-width: 42rem)');
const subscribe = (notify: () => void) => {
  narrowQuery.addEventListener('change', notify);
  return () => narrowQuery.removeEventListener('change', notify);
};

const toFix = (count: number) => (count === 1 ? '1 answer to fix' : `${count} answers to fix`);

export function StepProgress({
  current,
  total,
  steps,
  marks,
  counterLabel,
  stepTitle,
  stepDescription,
  stepErrorCount = 0,
  headingLevel = 2,
  rootProps,
}: FormStepProgressProps) {
  const narrow = useSyncExternalStore(subscribe, () => narrowQuery.matches);

  return (
    <Stack gap={5} style={{ marginBlockEnd: '2rem' }} {...rootProps}>
      {steps && steps.length <= 4 && !narrow ? (
        <ProgressIndicator currentIndex={current - 1} spaceEqually>
          {steps.map((step, index) => {
            const invalid = !!marks && step.errorCount > 0;
            return (
              <ProgressStep
                key={step.id}
                label={step.title || `Step ${index + 1}`}
                secondaryLabel={invalid ? toFix(step.errorCount) : undefined}
                complete={index < current - 1 && !invalid}
                current={index === current - 1}
                invalid={invalid}
              />
            );
          })}
        </ProgressIndicator>
      ) : (
        <ProgressBar
          label={counterLabel ?? ''}
          value={current}
          max={total}
          helperText={stepErrorCount > 0 ? toFix(stepErrorCount) : undefined}
        />
      )}
      <Section level={headingLevel}>
        <Stack gap={3}>
          {stepTitle && <Heading className="cds--type-heading-04">{stepTitle}</Heading>}
          {stepDescription && <p className="cds--type-body-01">{stepDescription}</p>}
        </Stack>
      </Section>
    </Stack>
  );
}
