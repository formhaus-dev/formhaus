import { WarningFilled } from '@carbon/icons-react';

interface MessageProps {
  id?: string;
  error?: string;
  helper?: string;
  role?: 'alert';
}

export function GroupMessage({ id, error, helper, role }: MessageProps) {
  if (error)
    return (
      <div id={id} role={role} className="cds--radio-button__validation-msg group-error">
        <WarningFilled className="cds--radio-button__invalid-icon" />
        <div className="cds--form-requirement">{error}</div>
      </div>
    );
  if (!helper) return null;

  return (
    <div id={id} className="cds--form__helper-text">
      {helper}
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
