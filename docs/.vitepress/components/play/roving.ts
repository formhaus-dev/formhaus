export function roving(event: KeyboardEvent) {
  const items = [
    ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(':scope > [role="radio"], :scope > [role="tab"]'),
  ];
  const index = items.indexOf(event.target as HTMLButtonElement);
  const targets: Record<string, number> = {
    ArrowRight: index + 1,
    ArrowDown: index + 1,
    ArrowLeft: index - 1,
    ArrowUp: index - 1,
    Home: 0,
    End: -1,
  };
  const target = targets[event.key];
  if (target === undefined || index < 0) return;
  event.preventDefault();
  const next = items[(target + items.length) % items.length]!;
  next.focus();
  next.click();
}
