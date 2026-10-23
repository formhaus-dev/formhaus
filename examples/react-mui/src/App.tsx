import { parseDefinition, type FormDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { useMemo } from 'react';
import { FormActions } from './actions/FormActions';
import { ErrorSummary } from './actions/ErrorSummary';
import { Fields } from './actions/Fields';
import { Section } from './actions/Section';
import { StepProgress } from './actions/StepProgress';
import { components } from './component-map';
import json from './definition.json';

const layout = { actions: FormActions, progress: StepProgress, section: Section, errorSummary: ErrorSummary, fields: Fields };

const initial = parseDefinition(json);

export default function App({ definition = initial, mode = 'light' }: { definition?: FormDefinition; mode?: 'light' | 'dark' }) {
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <FormRenderer
          definition={definition}
          components={components}
          layout={layout}
          onSubmit={(values) => console.log('Submitted:', values)}
        />
      </Container>
    </ThemeProvider>
  );
}
