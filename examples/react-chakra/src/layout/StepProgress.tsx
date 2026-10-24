import type { FormStepProgressProps } from '@formhaus/react';
import { Heading, Progress, Stack, Steps, Text } from '@chakra-ui/react';

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
  return (
    <Stack gap="2" mb="6" {...rootProps}>
      {steps && steps.length <= 4 ? (
        <Steps.Root step={current - 1} count={total} size="sm" mb="4">
          <Steps.List>
            {steps.map((step, index) => {
              const invalid = marks && step.errorCount > 0;
              return (
                <Steps.Item key={step.id} index={index} colorPalette={invalid ? 'red' : undefined}>
                  <Steps.Indicator />
                  <Steps.Title hideBelow="sm" color={invalid ? 'fg.error' : undefined}>
                    {step.title || `Step ${index + 1}`}
                  </Steps.Title>
                  <Steps.Separator />
                </Steps.Item>
              );
            })}
          </Steps.List>
        </Steps.Root>
      ) : (
        <>
          <Progress.Root value={(current / total) * 100} size="sm" aria-label={counterLabel}>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
          <Text textStyle="xs" color="fg.muted">
            {counterLabel}
          </Text>
        </>
      )}
      {stepTitle && (
        <Heading as={`h${headingLevel}`} size="xl">
          {stepTitle}
        </Heading>
      )}
      {stepErrorCount > 0 && (
        <Text textStyle="sm" color="fg.error">
          {toFix(stepErrorCount)}
        </Text>
      )}
      {stepDescription && <Text color="fg.muted">{stepDescription}</Text>}
    </Stack>
  );
}
