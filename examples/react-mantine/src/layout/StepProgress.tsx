import type { FormStepProgressProps } from '@formhaus/react';
import { Progress, Stack, Stepper, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

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
  const narrow = useMediaQuery('(max-width: 36em)');
  const stepper = !!steps && steps.length <= 4;

  return (
    <Stack gap="xs" mb="lg" {...rootProps}>
      {stepper && steps ? (
        <Stepper active={current - 1} size="sm" allowNextStepsSelect={false} mb="sm">
          {steps.map((step, index) => (
            <Stepper.Step
              key={step.id}
              label={narrow ? undefined : step.title || `Step ${index + 1}`}
              aria-label={step.title || `Step ${index + 1}`}
              description={!narrow && marks && step.errorCount > 0 ? toFix(step.errorCount) : undefined}
              color={marks && step.errorCount > 0 ? 'red' : undefined}
              aria-current={index + 1 === current ? 'step' : undefined}
            />
          ))}
        </Stepper>
      ) : (
        <>
          <Progress value={(current / total) * 100} size="sm" aria-label={counterLabel} />
          <Text size="xs" c="dimmed">
            {counterLabel}
          </Text>
        </>
      )}
      {stepTitle && (
        <Title order={headingLevel} size="h3">
          {stepTitle}
        </Title>
      )}
      {(narrow || !stepper) && stepErrorCount > 0 && (
        <Text size="sm" c="red">
          {toFix(stepErrorCount)}
        </Text>
      )}
      {stepDescription && <Text c="dimmed">{stepDescription}</Text>}
    </Stack>
  );
}
