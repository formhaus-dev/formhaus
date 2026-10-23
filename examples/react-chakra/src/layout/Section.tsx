import type { SectionComponentProps } from '@formhaus/react';
import { Card, Fieldset, Stack, Table } from '@chakra-ui/react';

export function Section({ id, section, title, description, descriptionId, children }: SectionComponentProps) {
  const first = section.fields[0];
  const columns = section.layout === 'matrix' && first && 'options' in first ? (first.options ?? []) : null;

  return (
    <Card.Root asChild variant="outline">
      <Fieldset.Root id={id} aria-describedby={descriptionId} p="5" gap="4">
        <Stack gap="1">
          <Fieldset.Legend>{title}</Fieldset.Legend>
          {description && <Fieldset.HelperText id={descriptionId}>{description}</Fieldset.HelperText>}
        </Stack>
        {columns ? (
          <Table.ScrollArea>
            <Table.Root size="sm" minW="sm">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader />
                  {columns.map((column) => (
                    <Table.ColumnHeader key={column.value} textAlign="center">
                      {column.label}
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>{children}</Table.Body>
            </Table.Root>
          </Table.ScrollArea>
        ) : (
          <Fieldset.Content gap="6">{children}</Fieldset.Content>
        )}
      </Fieldset.Root>
    </Card.Root>
  );
}
