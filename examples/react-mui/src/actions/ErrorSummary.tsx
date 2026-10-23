import type { ErrorSummaryComponentProps } from '@formhaus/react';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';

export function ErrorSummary({ rootProps, title, groups, showField }: ErrorSummaryComponentProps) {
  return (
    <Alert severity="error" {...rootProps} sx={{ mb: 2 }}>
      <AlertTitle>{title}</AlertTitle>
      {groups.map((group) => (
        <div key={group.id}>
          {groups.length > 1 && (
            <Typography variant="body2" fontWeight={500} sx={{ mt: 1 }}>
              {group.title}
            </Typography>
          )}
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {group.entries.map((entry) => (
              <li key={entry.key}>
                <Link
                  href={`#${entry.id}`}
                  color="inherit"
                  onClick={(event) => {
                    event.preventDefault();
                    showField(entry.key);
                  }}
                >
                  {entry.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </Alert>
  );
}
