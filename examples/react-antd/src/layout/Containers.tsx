import type {
  ConfirmDialogComponentProps,
  FormActionsProps,
  GroupComponentProps,
  GroupItemComponentProps,
  SectionComponentProps,
} from '@formhaus/react';
import { Button, Card, Flex, Modal, Typography } from 'antd';
import type { CSSProperties } from 'react';

export function FormActions({
  rootProps,
  primaryLabel,
  showPrimary = true,
  showBack,
  backLabel,
  showSkip,
  skipLabel,
  cancelAction,
  loading,
  onPrimary,
  onBack,
  onSkip,
  onCancel,
}: FormActionsProps) {
  return (
    <Flex {...rootProps} justify="space-between" gap={8} className="actions">
      <Flex gap={8}>
        {showBack && (
          <Button disabled={loading} onClick={onBack}>
            {backLabel}
          </Button>
        )}
        {cancelAction && (
          <Button type="text" disabled={loading} onClick={onCancel}>
            {cancelAction.label}
          </Button>
        )}
      </Flex>
      <Flex gap={8}>
        {showSkip && onSkip && (
          <Button type="link" disabled={loading} onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
        {showPrimary && (
          <Button type="primary" loading={loading} onClick={onPrimary}>
            {primaryLabel}
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

export function Section({ id, section, title, description, descriptionId, children }: SectionComponentProps) {
  const first = section.fields[0];
  const columns = section.layout === 'matrix' && first && 'options' in first ? (first.options ?? []) : null;
  return (
    <fieldset id={id} aria-describedby={descriptionId} className="section">
      <legend>
        <Typography.Text strong>{title}</Typography.Text>
      </legend>
      {description && (
        <Typography.Paragraph id={descriptionId} type="secondary">
          {description}
        </Typography.Paragraph>
      )}
      {columns ? (
        <div
          className="matrix"
          style={{ '--matrix': `minmax(7rem, 2fr) repeat(${columns.length}, minmax(3.75rem, 1fr))` } as CSSProperties}
        >
          <div className="matrix-row matrix-row--head" aria-hidden="true">
            <span />
            {columns.map((column) => (
              <span key={column.value} className="matrix-row__cell">
                {column.label}
              </span>
            ))}
          </div>
          {children}
        </div>
      ) : (
        children
      )}
    </fieldset>
  );
}

export function Group({
  id,
  label,
  helperText,
  error,
  describedBy,
  items,
  canAdd,
  add,
  addLabel,
  disabled,
  status,
  itemComponent: Item,
}: GroupComponentProps) {
  return (
    <fieldset id={id} aria-describedby={describedBy} aria-invalid={!!error || undefined} className="section">
      <legend>
        <Typography.Text strong>{label}</Typography.Text>
      </legend>
      {helperText && (
        <Typography.Paragraph id={`${id}-helper`} type="secondary">
          {helperText}
        </Typography.Paragraph>
      )}
      {error && (
        <Typography.Paragraph id={`${id}-error`} type="danger">
          {error}
        </Typography.Paragraph>
      )}
      <Flex vertical gap={12}>
        {items.map((item) => (
          <Item key={item.id} {...item} />
        ))}
        {canAdd && (
          <Button type="dashed" block disabled={disabled} onClick={add}>
            {addLabel}
          </Button>
        )}
      </Flex>
      <span className="sr-only" role="status">
        {status}
      </span>
    </fieldset>
  );
}

export function GroupItem({
  title,
  titleId,
  canRemove,
  requestRemove,
  removeLabel,
  removeName,
  disabled,
  children,
}: GroupItemComponentProps) {
  return (
    <Card
      size="small"
      role="group"
      aria-labelledby={titleId}
      title={
        <span id={titleId} tabIndex={-1}>
          {title}
        </span>
      }
      extra={
        canRemove && (
          <Button type="link" danger size="small" disabled={disabled} aria-label={`${removeLabel} ${removeName}`} onClick={requestRemove}>
            {removeLabel}
          </Button>
        )
      }
    >
      {children}
    </Card>
  );
}

export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, confirm, cancel }: ConfirmDialogComponentProps) {
  return (
    <Modal
      open={open}
      title={title}
      okText={confirmLabel}
      cancelText={cancelLabel}
      okButtonProps={{ danger: true }}
      onOk={confirm}
      onCancel={cancel}
    >
      {description}
    </Modal>
  );
}
