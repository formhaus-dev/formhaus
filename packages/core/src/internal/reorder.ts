export const moveButtonId = (titleId: string, up: boolean): string => `${titleId}-${up ? 'up' : 'down'}`;

export function movedFocusId(titleId: string, from: number, to: number, count: number): string {
  const up = to < from;
  return moveButtonId(titleId, up !== (up ? to === 0 : to === count - 1));
}

export function keepReadOnly(event: { key?: string; preventDefault(): void }): void {
  if (event.key === undefined || event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault();
}
