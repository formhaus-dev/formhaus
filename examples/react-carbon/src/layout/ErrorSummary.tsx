import type { ErrorSummaryComponentProps } from '@formhaus/react';
import { ActionableNotification, Link, ListItem, UnorderedList } from '@carbon/react';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  const { role: _role, ...root } = rootProps;

  return (
    <ActionableNotification
      kind="error"
      role="alert"
      inline
      lowContrast
      hideCloseButton
      hasFocus={false}
      style={{ marginBlockStart: '2rem' }}
      title={title}
      {...root}
    >
      {groups.map((group) => (
        <div key={group.id}>
          {groups.length > 1 && <strong>{group.title}</strong>}
          <UnorderedList>
            {group.entries.map((entry) => (
              <ListItem key={entry.key}>
                <Link
                  href={`#${entry.id}`}
                  inline
                  onClick={(event) => {
                    event.preventDefault();
                    showField(entry.key);
                  }}
                >
                  {entry.text}
                </Link>
              </ListItem>
            ))}
          </UnorderedList>
        </div>
      ))}
    </ActionableNotification>
  );
}
