import type { SectionComponentProps } from '@formhaus/react';
import { GroupMessage } from '../fields/GroupMessage';
import { FormGroup, Stack, Table, TableBody, TableHead, TableHeader, TableRow, Tile } from '@carbon/react';

export function Section({ id, title, description, descriptionId, columns, children }: SectionComponentProps) {
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
