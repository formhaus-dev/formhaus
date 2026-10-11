import { validateSubmission } from '@formhaus/core/server';
import { definition } from '@/form/definition';
import { runServerValidators } from '@/form/validators';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { values, errors } = validateSubmission(definition, body?.values, { skippedSteps: body?.skippedSteps });
  runServerValidators(values, errors);
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 422 });
  }

  return Response.json({ values });
}
