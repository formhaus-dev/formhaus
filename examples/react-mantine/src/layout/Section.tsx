import type { SectionComponentProps } from '@formhaus/react';
import { Fieldset, Stack, Table, Text } from '@mantine/core';

export function Section({ id, title, description, descriptionId, columns, children }: SectionComponentProps) {
  return (
    <Fieldset id={id} legend={title} aria-describedby={descriptionId} radius="md">
      {description && (
        <Text id={descriptionId} size="sm" c="dimmed" mb="sm">
          {description}
        </Text>
      )}
      {columns ? (
        <Table.ScrollContainer minWidth={360}>
          <Table verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Td />
                {columns.map((column) => (
                  <Table.Th key={column.value} ta="center" fw={500} fz="sm">
                    {column.label}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{children}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      ) : (
        <Stack gap="md">{children}</Stack>
      )}
    </Fieldset>
  );
}
