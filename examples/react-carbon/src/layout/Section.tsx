import type { SectionComponentProps } from '@formhaus/react';
import { GroupMessage } from '../fields/GroupMessage';
import { FormGroup, Stack, Table, TableBody, TableHead, TableHeader, TableRow, Tile } from '@carbon/react';

export function Section({ id, section, title, description, descriptionId, children }: SectionComponentProps) {
  const first = section.fields[0];
  const columns = section.layout === 'matrix' && first && 'options' in first ? (first.options ?? []) : null;

  return (
    <Tile>
      <FormGroup id={id} legendText={title} aria-describedby={descriptionId}>
        <Stack gap={6}>
          <GroupMessage id={descriptionId} helper={description} />
          {columns ? (
            <Table size="md" useZebraStyles={false}>
              <TableHead>
                <TableRow>
                  <TableHeader />
                  {columns.map((column) => (
                    <TableHeader key={column.value}>{column.label}</TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>{children}</TableBody>
            </Table>
          ) : (
            <Stack gap={7}>{children}</Stack>
          )}
        </Stack>
      </FormGroup>
    </Tile>
  );
}
