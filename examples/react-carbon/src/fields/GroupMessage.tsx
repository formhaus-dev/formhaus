interface MessageProps {
  id?: string;
  error?: string;
  helper?: string;
  role?: 'alert';
}

export function GroupMessage({ id, error, helper, role }: MessageProps) {
  if (!error && !helper) return null;

  return (
    <div id={id} role={role} className="cds--form__helper-text" style={error ? { color: 'var(--cds-text-error)' } : undefined}>
      {error ?? helper}
    </div>
  );
}

export function Texts({ id, helperText, error, role }: { id?: string; helperText?: string; error?: string; role?: 'alert' }) {
  return (
    <>
      <GroupMessage id={`${id}-helper`} helper={helperText} />
      <GroupMessage id={`${id}-error`} error={error} role={role} />
    </>
  );
}
