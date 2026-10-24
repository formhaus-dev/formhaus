import type { FormStepProgressProps } from '@formhaus/react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Typography from '@mui/material/Typography';

export function StepProgress({
  current,
  total,
  steps,
  marks,
  counterLabel,
  stepTitle,
  stepDescription,
  headingLevel = 2,
}: FormStepProgressProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
      {steps && steps.length <= 4 ? (
        <Stepper activeStep={current - 1} alternativeLabel sx={{ mb: 1 }}>
          {steps.map((step, index) => (
            <Step key={step.id} completed={index + 1 < current}>
              <StepLabel error={marks && step.errorCount > 0}>{step.title || `Step ${index + 1}`}</StepLabel>
            </Step>
          ))}
        </Stepper>
      ) : (
        <>
          <LinearProgress variant="determinate" value={(current / total) * 100} aria-label={counterLabel} />
          <Typography variant="caption" color="text.secondary">
            {counterLabel}
          </Typography>
        </>
      )}
      {stepTitle && (
        <Typography variant="h6" component={`h${headingLevel}`} sx={{ mt: 0.5 }}>
          {stepTitle}
        </Typography>
      )}
      {stepDescription && (
        <Typography variant="body2" color="text.secondary">
          {stepDescription}
        </Typography>
      )}
    </Box>
  );
}
