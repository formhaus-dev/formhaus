import { describe, expect, it } from 'vitest';
import { capabilitiesTool } from '../src/capabilities';
import { simulatePathTool } from '../src/simulate';
import { translationTemplateTool } from '../src/translation';
import { linear } from './fixtures';

const keyed = {
  ...linear,
  i18n: { messages: { required: 'errors.required' } },
  steps: linear.steps.map((step) => ({
    ...step,
    fields: step.fields.map((field) => ({ ...field, i18n: { label: `signup.${field.key}` } })),
  })),
};

describe('translation_template', () => {
  it('returns the overlay skeleton, the file name and the slots', () => {
    const result = translationTemplateTool({ definition: keyed, lang: 'ru' });
    if (!result.ok) throw new Error('expected a template');
    expect(result.file).toBe('signup.ru.json');
    expect(result.overlay).toEqual({
      title: 'Sign up',
      submit: { label: 'Create' },
      steps: {
        name: { title: 'Name', fields: { name: { label: 'Name' } } },
        email: { title: 'Email', fields: { email: { label: 'Email' } } },
      },
      messages: {
        required: 'This field is required',
        maxLength: 'Maximum length is {max}',
        email: 'Enter a valid email',
        string: 'Must be text',
      },
      labels: {
        continue: 'Continue',
        back: 'Back',
        stepOf: 'Step {current} of {total}',
        errorSummary: 'Check these answers',
        required: 'required',
        stepErrors: 'Errors: {count}',
      },
    });
    expect(result.slots.find(({ address }) => address === 'steps.name.fields.name.label')).toMatchObject({
      key: 'signup.name',
      text: 'Name',
    });
    expect(result.slots.find(({ address }) => address === 'messages.required')).toMatchObject({ key: 'errors.required' });
    expect(result.slots.find(({ address }) => address === 'steps.name.title')).toMatchObject({ key: 'signup.steps.name.title' });
  });

  it('asks for the done label on a date or time field', () => {
    const definition = {
      id: 'visit',
      title: 'Visit',
      submit: { label: 'Book' },
      fields: [{ key: 'at', type: 'time', label: 'Time' }],
    };
    const result = translationTemplateTool({ definition, lang: 'ru' });
    if (!result.ok) throw new Error('expected a template');
    expect(result.overlay.labels).toMatchObject({ clear: 'Clear', done: 'Done' });
    const plain = translationTemplateTool({ definition: keyed, lang: 'ru' });
    if (!plain.ok) throw new Error('expected a template');
    expect(plain.overlay.labels).not.toHaveProperty('done');
  });

  it('lists explicit keys only with prefix false', () => {
    const result = translationTemplateTool({ definition: keyed, lang: 'de', prefix: false });
    if (!result.ok) throw new Error('expected a template');
    expect(result.slots.filter(({ key }) => key).map(({ key }) => key)).toEqual(['signup.name', 'signup.email', 'errors.required']);
  });

  it('returns validation issues for a broken definition', () => {
    const result = translationTemplateTool({ definition: { ...keyed, i18n: { description: 'x' } }, lang: 'ru' });
    expect(result.ok).toBe(false);
    expect(result.validation.issues.map(({ code }) => code)).toContain('i18n-unbound-slot');
  });
});

describe('simulate_path with an overlay', () => {
  it('reports errors in the overlay language', async () => {
    const overlay = { messages: { required: 'Обязательное поле' }, steps: { name: { title: 'Имя' } } };
    const result = await simulatePathTool({ definition: linear, answers: {}, overlay });
    expect(result.errors).toEqual({ name: 'Обязательное поле' });
    expect(result.currentStep?.title).toBe('Имя');
  });

  it('lists overlay entries it ignored', async () => {
    const overlay = { title: 5, steps: { ghost: { title: 'Призрак' } } };
    const result = await simulatePathTool({ definition: linear, answers: {}, overlay });
    expect(result.ok).toBe(true);
    expect(result.overlayIssues).toEqual(['unknown address steps.ghost.title was ignored', 'title is not text and was ignored']);
  });

  it('ignores an overlay for an invalid definition and reports the issues', async () => {
    const result = await simulatePathTool({ definition: { id: 'x' }, overlay: { title: 'X' } });
    expect(result.ok).toBe(false);
  });
});

describe('capabilities i18n', () => {
  it('derives message and label defaults from core', () => {
    const { i18n } = capabilitiesTool();
    expect(i18n.messages.defaults.minItems).toBe('At least {min} required');
    expect(Object.keys(i18n.messages.defaults)).toHaveLength(22);
    expect(i18n.messages.defaults.exclusive).toBe('Select "{option}" or other options, not both');
    expect(i18n.labels.defaults.or).toBe('or');
    expect(i18n.labels.defaults.stepOf).toBe('Step {current} of {total}');
    expect(i18n.labels.defaults.stepErrors).toBe('Errors: {count}');
    expect(i18n.labels.rule).toContain('stepTitle takes {index}');
    expect(i18n.labels.defaults.done).toBe('Done');
    expect(i18n.labels.rule).toContain('the confirm button of a date or time picker');
    expect(i18n.keys.slots.validation).toContain('matchField');
  });
});
