import { FormRenderer } from '@formhaus/react';
import { Container, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { FormActions } from './actions/FormActions';
import { StepProgress } from './actions/StepProgress';
import { components } from './component-map';
import definition from './definition.json';

const theme = createTheme();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <FormRenderer
          definition={definition}
          components={components}
          ActionsComponent={FormActions}
          ProgressComponent={StepProgress}
          onSubmit={(values) => console.log('Submitted:', values)}
        />
      </Container>
    </ThemeProvider>
  );
}
