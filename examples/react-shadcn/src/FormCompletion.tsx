import { CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { answers, completion, type CompletionProps } from './answers';

export function FormCompletion({ definition, values, onRestart }: CompletionProps) {
  return (
    <Card>
      <CardHeader>
        <CircleCheck className="mb-2 size-8 text-primary" aria-hidden />
        <CardTitle className="text-lg">
          <h2>{completion.title}</h2>
        </CardTitle>
        <CardDescription role="status">{completion.body}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="divide-y border-y">
          {answers(definition, values).map((answer) => (
            <div key={answer.key} className="grid gap-1 py-3">
              <dt className="text-muted-foreground">{answer.label}</dt>
              <dd className="font-medium break-words whitespace-pre-line">{answer.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onRestart}>
          {completion.again}
        </Button>
      </CardFooter>
    </Card>
  );
}
