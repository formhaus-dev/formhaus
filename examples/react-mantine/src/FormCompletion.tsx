import { Button, CheckIcon, Stack, Table, Text, ThemeIcon, Title } from '@mantine/core';
import { answers, completion, type CompletionProps } from './answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  return (
    <Stack gap="lg" align="flex-start">
      <ThemeIcon color="teal" size={48} radius="xl" variant="light">
        <CheckIcon size={20} />
      </ThemeIcon>
      <Stack gap={4}>
        <Title order={2}>{completion.title}</Title>
        <Text c="dimmed" role="status">
          {completion.body}
        </Text>
      </Stack>
      <Table variant="vertical" layout="fixed" withTableBorder verticalSpacing="sm" aria-label={completion.answers}>
        <Table.Tbody>
          {answers(definition, values).map((answer) => (
            <Table.Tr key={answer.key}>
              <Table.Th w="40%">{answer.label}</Table.Th>
              <Table.Td style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}>{answer.value}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Button variant="light" onClick={onRestart}>
        {completion.again}
      </Button>
    </Stack>
  );
}
