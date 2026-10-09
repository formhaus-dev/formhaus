import { FormEngine } from '@formhaus/core';
import { definition } from '@/form/definition';
import { parseValues } from '@/form/parse-values';
import { serverValidators } from '@/form/validators';

export async function POST(request: Request) {
  const values = parseValues(await request.json().catch(() => null));
  if (!values) {
    return Response.json({ message: 'Expected an object of string, number or boolean values' }, { status: 400 });
  }

  const engine = new FormEngine(definition, values, { validators: serverValidators });
  const errors = engine.validate();
  if (Object.keys(errors).length > 0) {
    return Response.json({ errors }, { status: 422 });
  }

  return Response.json({ values: engine.getSubmitValues() });
}
