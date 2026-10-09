import type { FormEngine } from './runtime';

function sameErrors(previous: Record<string, string>, next: Record<string, string>): boolean {
  const keys = Object.keys(next);
  return keys.length === Object.keys(previous).length && keys.every((key) => previous[key] === next[key]);
}

function holdsErrors(engine: FormEngine, errors: Record<string, string>): boolean {
  return Object.entries(errors).every(([key, message]) => (
    engine.errors[key] === message || engine.topLevelErrors.includes(message)
  ));
}

export function shouldApplyExternalErrors(
  engine: FormEngine,
  previous: Record<string, string> | undefined,
  next: Record<string, string>,
): boolean {
  return !previous || !sameErrors(previous, next) || !holdsErrors(engine, next);
}
