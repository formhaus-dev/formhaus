import { Alert, Button, DataList, Heading, Stack, useBreakpointValue } from '@chakra-ui/react';
import { answers, completion, type CompletionProps } from './answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  const orientation = useBreakpointValue({ base: 'vertical', sm: 'horizontal' } as const);
  return (
    <Stack gap="6" align="flex-start">
      <Alert.Root status="success" variant="subtle" role="status">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title as="h2">{completion.title}</Alert.Title>
          <Alert.Description>{completion.body}</Alert.Description>
        </Alert.Content>
      </Alert.Root>
      <Heading as="h3" size="md">
        {completion.answers}
      </Heading>
      <DataList.Root orientation={orientation} divideY="1px" width="full" gap="0">
        {answers(definition, values).map((answer) => (
          <DataList.Item key={answer.key} py="3" alignItems="flex-start">
            <DataList.ItemLabel flex="0 0 40%">{answer.label}</DataList.ItemLabel>
            <DataList.ItemValue overflowWrap="anywhere" whiteSpace="pre-line">
              {answer.value}
            </DataList.ItemValue>
          </DataList.Item>
        ))}
      </DataList.Root>
      <Button variant="outline" onClick={onRestart}>
        {completion.again}
      </Button>
    </Stack>
  );
}
