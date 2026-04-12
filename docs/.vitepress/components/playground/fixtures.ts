import basicForm from '../../../../examples/definitions/basic-form.json';
import conditionalFields from '../../../../examples/definitions/conditional-fields.json';
import multiStep from '../../../../examples/definitions/multi-step.json';
import validation from '../../../../examples/definitions/validation.json';

export const fixtures: Record<string, object> = {
  'Basic Form': basicForm,
  'Conditional Fields': conditionalFields,
  'Multi-Step': multiStep,
  'Validation': validation,
};

export const fixtureNames = Object.keys(fixtures);
