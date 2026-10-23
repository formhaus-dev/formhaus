import type { ErrorSummaryComponentProps } from '@formhaus/react';
import { Alert, Link, List, Text } from '@chakra-ui/react';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <Alert.Root status="error" my="6" {...rootProps}>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{title}</Alert.Title>
        <Alert.Description>
          {groups.map((group) => (
            <div key={group.id}>
              {groups.length > 1 && (
                <Text fontWeight="medium" mt="2">
                  {group.title}
                </Text>
              )}
              <List.Root ps="4">
                {group.entries.map((entry) => (
                  <List.Item key={entry.key}>
                    <Link
                      href={`#${entry.id}`}
                      color="inherit"
                      variant="underline"
                      onClick={(event) => {
                        event.preventDefault();
                        showField(entry.key);
                      }}
                    >
                      {entry.text}
                    </Link>
                  </List.Item>
                ))}
              </List.Root>
            </div>
          ))}
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
