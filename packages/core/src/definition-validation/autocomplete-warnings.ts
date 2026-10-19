import { BUILT_IN_TYPES } from '../validation/type-checks';
import type { FieldEntry } from './context';
import type { DefinitionIssue } from './issues';
import { warning } from './issues';

const AUTOCOMPLETE_TYPES = ['text', 'email', 'phone', 'password', 'textarea', 'number', 'date', 'select', 'autocomplete', 'radio'];

const alternatives = (words: string) => words.replace(/ /g, '|');
const CONTACT = 'tel tel-country-code tel-national tel-area-code tel-local tel-local-prefix tel-local-suffix tel-extension email impp';
const NAMES =
  'name honorific-prefix given-name additional-name family-name honorific-suffix nickname username new-password current-password one-time-code organization-title organization street-address address-line1 address-line2 address-line3 address-level1 address-level2 address-level3 address-level4 country country-name postal-code cc-name cc-given-name cc-additional-name cc-family-name cc-number cc-exp cc-exp-month cc-exp-year cc-csc cc-type transaction-currency transaction-amount language bday bday-day bday-month bday-year sex url photo';
const token = () =>
  new RegExp(
    `^(?:on|off|(?:section-[a-z0-9_-]+ )?(?:(?:shipping|billing) )?(?:(?:(?:${alternatives('home work mobile fax pager')}) )?(?:${alternatives(CONTACT)})|(?:${alternatives(NAMES)}))(?: webauthn)?)$`,
  );

export function autocompleteWarnings({ field, path }: FieldEntry): DefinitionIssue[] {
  const { autocomplete } = field;
  const at = `${path}/autocomplete`;
  if (autocomplete === undefined) return [];
  if (BUILT_IN_TYPES.includes(field.type) && !AUTOCOMPLETE_TYPES.includes(field.type)) {
    return [
      warning(
        'autocomplete-not-applicable',
        at,
        `"autocomplete" does not apply to ${field.type} fields`,
        `Use it on ${AUTOCOMPLETE_TYPES.join(', ')} fields, or remove it`,
      ),
    ];
  }
  return typeof autocomplete === 'string' && token().test(autocomplete.trim().toLowerCase().replace(/\s+/g, ' '))
    ? []
    : [
        warning(
          'unknown-autocomplete-token',
          at,
          `${JSON.stringify(autocomplete)} is not an HTML autofill token`,
          'Use a token such as "given-name", "email" or "street-address", or "off"',
        ),
      ];
}
