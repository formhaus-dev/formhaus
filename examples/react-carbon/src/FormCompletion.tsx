import {
  Button,
  Heading,
  InlineNotification,
  Section,
  Stack,
  StructuredListBody,
  StructuredListCell,
  StructuredListRow,
  StructuredListWrapper,
} from '@carbon/react';
import { answers, completion, type CompletionProps } from './answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  return (
    <Section level={2}>
      <Stack gap={7}>
        <InlineNotification
          kind="success"
          lowContrast
          hideCloseButton
          role="status"
          title={completion.title}
          subtitle={completion.body}
          className="answers__notice"
        />
        <Section level={3}>
          <Stack gap={5}>
            <Heading className="cds--type-heading-03">{completion.answers}</Heading>
            <StructuredListWrapper isCondensed aria-label={completion.answers} className="answers">
              <StructuredListBody>
                {answers(definition, values).map((answer) => (
                  <StructuredListRow key={answer.key}>
                    <StructuredListCell className="answers__label">{answer.label}</StructuredListCell>
                    <StructuredListCell className="answers__value">{answer.value}</StructuredListCell>
                  </StructuredListRow>
                ))}
              </StructuredListBody>
            </StructuredListWrapper>
          </Stack>
        </Section>
        <div>
          <Button kind="tertiary" onClick={onRestart}>
            {completion.again}
          </Button>
        </div>
      </Stack>
    </Section>
  );
}
