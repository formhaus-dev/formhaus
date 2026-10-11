import { validateSubmission } from '@formhaus/core/server';
import { definition } from '~~/shared/definition';
import { runServerValidators } from '../validators';

export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => null);
  const { values, errors } = validateSubmission(definition, body?.values, { skippedSteps: body?.skippedSteps });
  runServerValidators(values, errors);
  if (Object.keys(errors).length > 0) {
    setResponseStatus(event, 422);
    return { errors };
  }

  return { values };
});
