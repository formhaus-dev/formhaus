import type { ControlShellProps } from '@formhaus/react/controls';
import { Group, Input, Stack, Text } from '@mantine/core';
import { createContext, type ReactNode, useContext } from 'react';
import { spoken } from './labels';

const Inline = createContext(false);

export function RadioList({ children }: { children: ReactNode }) {
  return useContext(Inline) ? <Group gap="lg">{children}</Group> : <Stack gap="xs">{children}</Stack>;
}

export function GroupShell({ field, f, rootProps, anchors, children }: ControlShellProps) {
  return (
    <Input.Wrapper
      {...rootProps}
      {...spoken(f)}
      role="group"
      aria-labelledby={`${f.id}-label`}
      labelElement="div"
      labelProps={{ id: `${f.id}-label` }}
      descriptionProps={{ id: f.helperId }}
      errorProps={{ id: f.errorId }}
    >
      <Stack gap={4} mt="xs" mb={4}>
        <Inline.Provider value={field.layout === 'inline'}>{children}</Inline.Provider>
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
