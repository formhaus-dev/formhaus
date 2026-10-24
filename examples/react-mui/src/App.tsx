import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Container, CssBaseline, ThemeProvider, Typography, createTheme } from '@mui/material';
import { useMemo, useState } from 'react';
import { FormActions } from './actions/FormActions';
import { ErrorSummary } from './actions/ErrorSummary';
import { Fields } from './actions/Fields';
import { ConfirmDialog, Group, GroupItem } from './actions/Groups';
import { Section } from './actions/Section';
import { StepProgress } from './actions/StepProgress';
import { FormCompletion } from './FormCompletion';
import { components } from './component-map';
import json from './definition.json';

const layout = {
  actions: FormActions,
  progress: StepProgress,
  section: Section,
  errorSummary: ErrorSummary,
  fields: Fields,
  group: Group,
  groupItem: GroupItem,
  confirmDialog: ConfirmDialog,
};

const initial = parseDefinition(json);

export default function App({ definition = initial, mode = 'light' }: { definition?: FormDefinition; mode?: 'light' | 'dark' }) {
  const [submitted, setSubmitted] = useState<Record<string, unknown> | null>(null);
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline enableColorScheme />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        {submitted ? (
          <FormCompletion definition={definition} values={submitted} onRestart={() => setSubmitted(null)} />
        ) : (
          <>
            {definition.title && (
              <Typography variant="h5" component="h1" gutterBottom>
                {definition.title}
              </Typography>
            )}
            <FormRenderer definition={definition} components={components} layout={layout} conditionalReveal onSubmit={setSubmitted} />
          </>
        )}
      </Container>
    </ThemeProvider>
  );
}
