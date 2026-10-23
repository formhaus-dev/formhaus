import type { ErrorSummaryComponentProps, FormErrorsComponentProps, FormStepProgressProps } from '@formhaus/react';
import { Alert, Progress, Steps, Typography } from 'antd';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <div {...rootProps} className="slot">
      <Alert
        type="error"
        showIcon
        title={title}
        description={groups.map((group) => (
          <div key={group.id}>
            {groups.length > 1 && <Typography.Text strong>{group.title}</Typography.Text>}
            <ul className="summary-list">
              {group.entries.map((entry) => (
                <li key={entry.key}>
                  <Typography.Link
                    href={`#${entry.id}`}
                    onClick={(event) => {
                      event.preventDefault();
                      showField(entry.key);
                    }}
                  >
                    {entry.text}
                  </Typography.Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      />
    </div>
  );
}

export function FormErrors({ rootProps, errors }: FormErrorsComponentProps) {
  if (!errors.length) return null;
  return (
    <div {...rootProps} className="slot">
      <Alert type="error" showIcon title={errors.length === 1 ? errors[0] : errors.map((error) => <div key={error}>{error}</div>)} />
    </div>
  );
}

export function StepProgress({
  rootProps,
  current,
  total,
  steps,
  marks = true,
  counterLabel,
  stepTitle,
  stepDescription,
  headingLevel = 2,
}: FormStepProgressProps) {
  const level = Math.min(Math.max(headingLevel, 1), 5) as 1 | 2 | 3 | 4 | 5;
  return (
    <div {...rootProps} className="slot">
      {steps ? (
        <Steps
          size="small"
          current={current - 1}
          responsive={false}
          items={steps.map((step, index) => ({
            title: step.title || `Step ${index + 1}`,
            status: marks && step.errorCount ? 'error' : undefined,
          }))}
        />
      ) : (
        <Progress percent={Math.round((current / total) * 100)} showInfo={false} />
      )}
      <Typography.Text type="secondary" className="counter">
        {counterLabel ?? `Step ${current} of ${total}`}
      </Typography.Text>
      {stepTitle && (
        <Typography.Title level={level} style={{ fontSize: 20, margin: '4px 0 0' }}>
          {stepTitle}
        </Typography.Title>
      )}
      {stepDescription && <Typography.Paragraph type="secondary">{stepDescription}</Typography.Paragraph>}
    </div>
  );
}
