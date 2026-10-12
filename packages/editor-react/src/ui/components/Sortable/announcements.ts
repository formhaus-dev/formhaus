import type { Announcements, ScreenReaderInstructions, UniqueIdentifier } from '@dnd-kit/core';

export interface MoveMessages {
  label: (id: UniqueIdentifier) => string;
  position: (id: UniqueIdentifier) => number;
  total: number;
  describe?: ((label: string, position: number, total: number) => string) | undefined;
}

export const instructions: ScreenReaderInstructions = {
  draggable: 'To pick up, press Space or Enter. Use the arrow keys to move, Space or Enter to drop, Escape to cancel.',
};

export function moveAnnouncements({ label, position, total, describe }: MoveMessages): Announcements {
  const moved = (name: string, at: number) => describe?.(name, at, total) ?? `${name} moved to position ${at} of ${total}`;
  return {
    onDragStart: ({ active }) => `Picked up ${label(active.id)}, position ${position(active.id)} of ${total}`,
    onDragOver: ({ active, over }) => {
      if (!over) return `${label(active.id)} is outside the list`;
      return over.id === active.id ? undefined : moved(label(active.id), position(over.id));
    },
    onDragEnd: ({ active, over }) =>
      over ? moved(label(active.id), position(over.id)) : `${label(active.id)} dropped back at position ${position(active.id)}`,
    onDragCancel: ({ active }) => `Move cancelled, ${label(active.id)} stays at position ${position(active.id)} of ${total}`,
  };
}
