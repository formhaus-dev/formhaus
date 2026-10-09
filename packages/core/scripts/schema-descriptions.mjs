export const DESCRIPTIONS = {
  FormDefinition: 'A Formhaus form. Use fields for a single-step form or steps for a multi-step form, not both.',
  'FormDefinition.id': 'Unique form identifier.',
  'FormDefinition.title': 'Form title for host UI and Figma output. Renderers do not display it.',
  'FormDefinition.submit': 'Submit button on the last step.',
  'FormDefinition.cancel': 'Optional cancel button.',
  'FormDefinition.fields': 'Fields of a single-step form.',
  'FormDefinition.steps': 'Steps of a multi-step form. When present, fields is ignored.',
  'FormStep.id': 'Unique step identifier, used as a route target.',
  'FormStep.routes': 'Forward destinations checked in order. The first match with a visible target wins. With no match, navigation continues to the next visible step.',
  'FormStep.next': 'Overrides the Continue button. false hides it.',
  'FormStep.back': 'Overrides the Back button. false hides it.',
  'FormStep.skip': 'Shows a Skip button that resets the step fields and moves forward without validation.',
  'FormStep.show': 'Step is visible only when all conditions match. Hidden steps are skipped and not submitted.',
  'FormStep.showAny': 'Step is visible when any condition matches.',
  'FormField.key': 'Key of the field value in the submitted values. Unique within the form.',
  'FormField.type': 'Field type. A built-in type or a custom type rendered through the renderer components prop.',
  'FormField.label': 'Label text.',
  'FormField.helperText': 'Hint text below the field.',
  'FormField.defaultValue': 'Initial value. Also the value restored on reset or skip.',
  'FormField.autoAdvance': 'Moves to the next step when the field is committed: a built-in radio on click, Space or Enter, or a custom field calling onCommit. The last step never auto-submits.',
  'FormField.show': 'Field is visible only when all conditions match. Hidden fields are cleared, not validated and not submitted.',
  'FormField.showAny': 'Field is visible when any condition matches.',
  'FormField.validation': 'Validation rules checked on Continue and on submit, not on blur.',
  'FormField.options': 'Static options for select, autocomplete, multiselect and radio fields.',
  'FormField.optionsFrom': 'Key of an options provider passed to the renderer, used instead of static options.',
  'FieldValidation.matchField': 'Key of another field whose value this field must equal.',
  StepRoute: 'A forward destination for a step.',
  'StepRoute.to': 'Id of a later step. null makes the current step the last one on this path.',
  'StepRoute.show': 'Route matches only when all conditions match. Without show or showAny the route always matches.',
  'StepRoute.showAny': 'Route matches when any condition matches.',
  ShowCondition: 'A condition on another field value. Use one operator per condition; only the first of eq, neq, in, notIn, notEmpty applies.',
  'ShowCondition.field': 'Key of the field to check.',
  'ShowCondition.eq': 'Matches when the value strictly equals this.',
  'ShowCondition.neq': 'Matches when the value does not strictly equal this.',
  'ShowCondition.in': 'Matches when the value is one of these.',
  'ShowCondition.notIn': 'Matches when the value is none of these.',
  'ShowCondition.notEmpty': 'Matches when the value is not undefined, null or an empty string.',
};

export function applyDescriptions(definitions) {
  for (const [path, description] of Object.entries(DESCRIPTIONS)) {
    const [name, property] = path.split('.');
    const definition = definitions[name];
    const target = property ? definition?.properties?.[property] : definition;
    if (!target) throw new Error(`Schema description path "${path}" does not exist`);
    target.description = description;
  }
}
