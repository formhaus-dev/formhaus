import { Alert, AlertTitle, Button, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableRow, Typography } from '@mui/material';
import { answers, completion, type CompletionProps } from './answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  return (
    <Stack spacing={3} alignItems="flex-start">
      <Alert severity="success" role="status" sx={{ alignSelf: 'stretch' }}>
        <AlertTitle component="h2">{completion.title}</AlertTitle>
        {completion.body}
      </Alert>
      <Typography variant="h6" component="h3">
        {completion.answers}
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label={completion.answers}>
          <TableBody>
            {answers(definition, values).map((answer) => (
              <TableRow key={answer.key} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ color: 'text.secondary', width: '40%', verticalAlign: 'top' }}>
                  {answer.label}
                </TableCell>
                <TableCell sx={{ overflowWrap: 'anywhere', whiteSpace: 'pre-line' }}>{answer.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" onClick={onRestart}>
        {completion.again}
      </Button>
    </Stack>
  );
}
