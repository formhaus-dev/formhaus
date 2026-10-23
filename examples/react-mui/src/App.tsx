import { parseDefinition } from '@formhaus/core';
import { FormRenderer } from '@formhaus/react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { FormActions } from './actions/FormActions';
import { StepProgress } from './actions/StepProgress';
import { components } from './component-map';
import json from './definition.json';

const layout = { actions: FormActions, progress: StepProgress };

const definition = parseDefinition(json);
const theme = createTheme();

export default function App() {
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
