import type { ControlShellProps } from '@formhaus/react/controls';
import { Group, Input, Stack, Text } from '@mantine/core';
import { labels } from './labels';

export function GroupShell({ f, rootProps, anchors, children }: ControlShellProps) {
  return (
    <Input.Wrapper
      {...rootProps}
      {...labels(f)}
      role="group"
      aria-labelledby={`${f.id}-label`}
      labelElement="div"
      labelProps={{ id: `${f.id}-label` }}
      descriptionProps={{ id: f.helperId }}
      errorProps={{ id: f.errorId }}
    >
      <Stack gap={4} mt="xs" mb={4}>
        {children}
        {anchors.some(Boolean) && (
          <Group justify="space-between">
            {anchors.map((anchor, index) => (
              <Text key={index} size="xs" c="dimmed">
                {anchor?.label}
              </Text>
            ))}
          </Group>
        )}
      </Stack>
    </Input.Wrapper>
  );
}
