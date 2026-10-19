import { checkDefinition, type FormDefinition, type FormNode } from '@formhaus/core';
import { childrenOf, isQuestion, toDefinition, type BuilderForm } from '../src';

const party = (key: string, label: string): FormNode => ({
  key,
  type: 'group',
  label,
  fields: [
    {
      key: 'kind',
      type: 'radio',
      label: 'Kind',
      options: [
        { value: 'company', label: 'Company' },
        { value: 'person', label: 'Person' },
      ],
    },
    { key: 'detail', type: 'text', label: 'Detail', show: [{ field: 'kind', eq: 'company' }] },
  ],
});

export const order: FormDefinition = {
  formatVersion: '1.1',
  id: 'order',
  title: 'Order',
  submit: { label: 'Send' },
  fields: [party('billing', 'Billing'), party('shipping', 'Shipping')],
};

export const household: FormDefinition = {
  formatVersion: '1.1',
  id: 'household',
  title: 'Household',
  submit: { label: 'Send' },
  fields: [
    {
      key: 'home',
      type: 'section',
      title: 'Home',
      fields: [
        {
          key: 'ownership',
          type: 'radio',
          label: 'Owner',
          options: [
            { value: 'own', label: 'Own' },
            { value: 'rent', label: 'Rent' },
          ],
        },
        { key: 'landlord', type: 'text', label: 'Landlord', show: [{ field: 'ownership', eq: 'rent' }] },
        {
          key: 'people',
          type: 'group',
          label: 'People',
          fields: [
            { key: 'fullName', type: 'text', label: 'Name' },
            { key: 'nick', type: 'text', label: 'Nickname', show: [{ field: 'fullName', notEmpty: true }] },
          ],
        },
      ],
    },
  ],
};

export const signup: FormDefinition = {
  formatVersion: '1.1',
  id: 'signup',
  title: 'Signup',
  submit: { label: 'Send' },
  steps: [
    {
      id: 'one',
      fields: [
        { key: 'email', type: 'email', label: 'Email' },
        {
          key: 'repeat',
          type: 'email',
          label: 'Repeat',
          validation: { matchField: 'email' },
          show: [{ field: 'email', notEmpty: true }],
        },
        { key: 'city', type: 'select', label: 'City', optionsFrom: 'cities', optionsDependsOn: ['email'] },
      ],
      routes: [{ to: null, show: [{ field: 'email', notEmpty: true }] }, { to: 'two' }],
    },
    { id: 'two', fields: [{ key: 'note', type: 'text', label: 'Note' }] },
  ],
};

export const errors = (form: BuilderForm) => checkDefinition(toDefinition(form)).filter((issue) => issue.severity === 'error');
export const inner = (form: BuilderForm, group: string, key: string) =>
  childrenOf(form, form.blocks.find((block) => isQuestion(block) && block.key === group)!.uid).find((child) => child.key === key)!;
