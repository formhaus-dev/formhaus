export function roving(event: KeyboardEvent) {
  const steps: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  const step = steps[event.key];
  const items = [
    ...(event.currentTarget as HTMLElement).querySelectorAll<HTMLButtonElement>(':scope > [role="radio"], :scope > [role="tab"]'),
  ];
  const index = items.indexOf(event.target as HTMLButtonElement);
  if (!step || index < 0) return;
  event.preventDefault();
  const next = items[(index + step + items.length) % items.length]!;
  next.focus();
  next.click();
}
