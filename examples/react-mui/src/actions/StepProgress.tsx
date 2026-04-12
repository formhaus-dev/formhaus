import type { FormStepProgressProps } from '@formhaus/react';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';

export function StepProgress({
  current,
  total,
  stepTitle,
  stepDescription,
}: FormStepProgressProps) {
  const percent = (current / total) * 100;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
      <LinearProgress variant="determinate" value={percent} />
      <Typography variant="caption" color="text.secondary">
        Step {current} of {total}
      </Typography>
      {stepTitle && (
        <Typography variant="h6" sx={{ mt: 0.5 }}>
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
