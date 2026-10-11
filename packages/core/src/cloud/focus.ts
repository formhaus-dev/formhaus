interface Searchable {
  querySelector(selector: string): unknown;
}

interface Focusable extends Searchable {
  focus(options?: { preventScroll?: boolean }): void;
  scrollIntoView?(options?: { block?: 'center' | 'nearest' }): void;
  matches(selector: string): boolean;
}

const CONTROLS = 'input:not([type="hidden"]):not(:disabled), select:not(:disabled), textarea:not(:disabled), button:not(:disabled)';

function reveal(target: Focusable, scrollTo: Focusable): void {
  scrollTo.scrollIntoView?.({ block: 'center' });
  target.focus({ preventScroll: true });
}

export function focusProblem(root: Searchable | null, notice?: Focusable | null): void {
  if (notice) return reveal(notice, notice);
  const invalid = root?.querySelector('[aria-invalid="true"]') as Focusable | null | undefined;
  if (invalid) reveal(invalid.matches(CONTROLS) ? invalid : (invalid.querySelector(CONTROLS) as Focusable | null) ?? invalid, invalid);
}
