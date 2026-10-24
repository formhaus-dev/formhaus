import type { ErrorSummaryComponentProps } from '@formhaus/react';
import { Alert, Anchor, List, Text } from '@mantine/core';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <Alert color="red" variant="light" title={title} my="lg" {...rootProps}>
      {groups.map((group) => (
        <div key={group.id}>
          {groups.length > 1 && (
            <Text size="sm" fw={500} mt="xs">
              {group.title}
            </Text>
          )}
          <List size="sm" spacing={2}>
            {group.entries.map((entry) => (
              <List.Item key={entry.key}>
                <Anchor
                  href={`#${entry.id}`}
                  c="inherit"
                  underline="always"
                  size="sm"
                  onClick={(event) => {
                    event.preventDefault();
                    showField(entry.key);
                  }}
                >
                  {entry.text}
                </Anchor>
              </List.Item>
            ))}
          </List>
        </div>
      ))}
    </Alert>
  );
}
