import { validateSubmission } from '@formhaus/core/server';
import { definition } from '@/form/definition';
import { serverValidators } from '@/form/validators';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { values, errors } = validateSubmission(definition, body?.values, {
    skippedSteps: body?.skippedSteps,
    validators: serverValidators,
  });
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 422 });
  }

  return Response.json({ values });
}
