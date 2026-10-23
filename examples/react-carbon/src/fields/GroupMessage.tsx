export function GroupMessage({ id, error, helper }: { id?: string; error?: string; helper?: string }) {
  if (!error && !helper) return null;

  return (
    <div id={id} className="cds--form__helper-text" style={error ? { color: 'var(--cds-text-error)' } : undefined}>
      {error ?? helper}
    </div>
  );
}
