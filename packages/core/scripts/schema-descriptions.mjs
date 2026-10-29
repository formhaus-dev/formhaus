const DESCRIPTIONS = {
  FormDefinition: 'A Formhaus form. Use fields for a single-step form or steps for a multi-step form, not both.',
  'FormDefinition.formatVersion':
    'Format version of the definition, such as "1.7". Core rejects a newer major version. Sections and groups were added in 1.1, props in 1.2, scale, rating, option images, columns and matrix sections in 1.3, contains and notContains in 1.4, answer recall with {{key}} in texts and exclusive options in 1.5, randomize and pinned options in 1.6, multiple files in 1.7.',
  'FormDefinition.id': 'Unique form identifier.',
  'FormDefinition.lang': 'Language of the texts, a BCP 47 tag such as "en" or "pt-BR". Renderers set it as the lang attribute of the form.',
  'FormDefinition.messages':
    'Validation message templates by message key. {min} and {max} are replaced. Field-level messages win over these.',
  'FormDefinition.labels':
    'Renderer label templates: continue, back, stepOf ({current}, {total}), errorSummary, addItem, removeItem, itemLabel ({label}, {index}), itemAdded, itemRemoved, removeItemPrompt and removeItemBody ({item}), removeItemNamed ({label}, {item}), cancel, enlargeImage ({label}), close, clear, done, chooseFile, required, skip, submit, stepTitle ({index}), stepErrors ({count}), fileCount ({count}), or and select.',
  'FormDefinition.i18n':
    'Translation keys for the form texts and the messages and labels catalogs, resolved by the app translate function.',
  'FormStep.i18n': 'Translation keys for the step title and description. The literal texts stay the fallback.',
  'FormField.i18n': 'Translation keys for label, placeholder and helperText. The literal texts stay the fallback.',
  'FieldOption.i18n': 'Translation key for the option label.',
  'FieldOption.image':
    'Image URL shown above the label on radio and multiselect options. The label stays visible and names the option. Select and autocomplete ignore it.',
  'FieldOption.exclusive':
    'Multiselect only: picking this option clears the other answers, and picking another option clears it. Renderers show an "or" divider before it. Added in format 1.5.',
  'FieldOption.pinned':
    'Keeps this option at its written position when the field has randomize. Exclusive options are always pinned. Added in format 1.6.',
  'FormAction.i18n': 'Translation key for the button label.',
  'FieldValidation.i18n': 'Translation keys for the messages of the validation rules, by rule name.',
  'FormDefinition.title': 'Form title for host UI and Figma output. Renderers do not display it.',
  'FormDefinition.description':
    'Plain text shown under the title by the host UI and Figma output. Renderers do not display it. Up to 1000 characters.',
  'FormDefinition.submit': 'Submit button on the last step.',
  'FormDefinition.cancel': 'Optional cancel button.',
  'FormDefinition.fields': 'Fields of a single-step form.',
  'FormDefinition.steps': 'Steps of a multi-step form. FormEngine rejects a definition with both non-empty fields and steps.',
  'FormStep.id': 'Unique step identifier, used as a route target. FormEngine rejects duplicates.',
  'FormStep.routes':
    'Forward destinations checked in order. The first match with a visible target wins. With no match, navigation continues to the next visible step.',
  'FormStep.fields': 'Fields of the step. May be empty for a welcome or statement step.',
  'FormStep.next': 'Overrides the Continue button. false hides it.',
  'FormStep.back': 'Overrides the Back button. false hides it.',
  'FormStep.skip': 'Shows a Skip button that resets the step fields and moves forward without validation.',
  'FormStep.show': 'Step is visible only when all conditions match. Hidden steps are skipped and not submitted.',
  'FormStep.showAny': 'Step is visible when any condition matches.',
  'FormField.key': 'Key of the field value in the submitted values. Unique within the form.',
  'FormField.type': 'Field type. A built-in type or a custom type rendered through the renderer components prop.',
  'FormField.label': 'Label text. Required for every type except hidden. From 1.5, {{key}} shows an earlier answer.',
  'FormField.helperText': 'Hint text between the label and the control.',
  'FormField.defaultValue':
    'Initial value. Also the value restored on reset or skip, and the start value of a field shown with no last value.',
  'FormField.props': 'Settings of a custom field type. Core ignores them; renderers pass them to the custom component as field.props.',
  'FormField.source':
    'Fills a hidden field in the browser at mount: a URL parameter ({ "query": "utm_source" }), the referrer, the page URL without query and hash, the page title, the browser language, the time zone or the device class. country is filled by the server. defaultValue is the fallback and initialValues win.',
  'FormField.autoAdvance':
    'Moves to the next step when the field is committed: a built-in radio, scale or rating on click, Space, Enter or a digit key, or a custom field calling onCommit. The last step never auto-submits.',
  'FormField.show': 'Field is visible only when all conditions match. Hidden fields are cleared, not validated and not submitted.',
  'FormField.showAny': 'Field is visible when any condition matches.',
  'FormField.validation': 'Validation rules checked on Continue and on submit, not on blur.',
  'FormField.options':
    'Static options for select, autocomplete, multiselect and radio fields. On scale and rating fields, anchor labels whose value is a point number: the first, middle and last points show their label.',
  'FormField.randomize':
    'Radio, multiselect and select only: shows the options in a random order per respondent. Pinned and exclusive options keep their written position. Not applied in a matrix section. Added in format 1.6.',
  'FormField.multiple':
    'File only: the field keeps a list of files and its value is an array. validation.minLength and maxLength count the files, and required needs at least one. Takes effect only with "formatVersion": "1.7" or newer. Added in format 1.7.',
  'FormField.layout':
    'Option layout for radio and multiselect fields. stack (default) lists options vertically. inline places short options side by side and wraps them.',
  'FormField.columns':
    'Cards per row, 1 to 4, for radio and multiselect options with images. Without it, cards fill the row at about 200px each. Narrow screens show at most 2 per row.',
  'FormField.autocomplete':
    'HTML autofill token, such as "given-name", "email" or "street-address", or "off". Built-in text, email, phone, password, textarea, number, date, select, autocomplete and radio fields set it as the autocomplete attribute.',
  'FormField.optionsFrom': 'Key of an options provider passed to the renderer, used instead of static options.',
  'FieldValidation.matchField': 'Key of another field whose value this field must equal.',
  FormNode: 'A field, a section of fields or a repeatable group, told apart by type.',
  FormSection: 'A titled block of fields with shared show conditions. Its fields keep their own keys in the submitted values.',
  'FormSection.key': 'Section identifier for translations, DOM ids and editors. Unique among field keys. Conditions cannot test it.',
  'FormSection.title': 'Section heading.',
  'FormSection.description': 'Text below the section heading.',
  'FormSection.layout':
    'matrix renders the section as a grid: each field is a row and the options of the first field are the column headers. Use radio or multiselect fields with the same options.',
  'FormSection.show': 'Section and its fields are visible only when all conditions match. Hidden fields are cleared.',
  'FormSection.showAny': 'Section is visible when any condition matches.',
  'FormSection.fields': 'Fields and groups of the section. Sections do not nest. May be empty for a statement.',
  'FormSection.i18n': 'Translation keys for the section title and description.',
  FormGroup: 'A repeatable group. Its value is an array of item objects keyed by the keys of its fields.',
  'FormGroup.key': 'Key of the item array in the submitted values. No other field key may start with this key and a dot.',
  'FormGroup.label': 'Group heading.',
  'FormGroup.helperText': 'Hint text below the group heading.',
  'FormGroup.itemLabel': 'Item heading. {index} is the 1-based item number, {label} the group label.',
  'FormGroup.addLabel': 'Text of the button that adds an item.',
  'FormGroup.removeLabel': 'Text of the button that removes an item.',
  'FormGroup.defaultItems': 'Number of empty items the group starts with.',
  'FormGroup.show': 'Group is visible only when all conditions match. A hidden group is cleared.',
  'FormGroup.showAny': 'Group is visible when any condition matches.',
  'FormGroup.validation': 'Item count rules. required means at least one item; minLength and maxLength count items.',
  'FormGroup.fields':
    'Fields of one item. Their keys are unique in the item and do not repeat a key outside the group. Their conditions can test fields of the same item and fields outside the group.',
  'FormGroup.i18n': 'Translation keys for the group texts.',
  StepRoute: 'A forward destination for a step.',
  'StepRoute.to': 'Id of a later step. null makes the current step the last one on this path.',
  'StepRoute.show': 'Route matches only when all conditions match. Without show or showAny the route always matches.',
  'StepRoute.showAny': 'Route matches when any condition matches.',
  ShowCondition:
    'A condition on another field value. Use exactly one operator: eq, neq, in, notIn, contains, notContains, notEmpty, gt, gte, lt or lte.',
  'ShowCondition.field': 'Key of the field to check.',
  'ShowCondition.eq': 'Matches when the value strictly equals this.',
  'ShowCondition.neq': 'Matches when the value does not strictly equal this.',
  'ShowCondition.in': 'Matches when the value is one of these.',
  'ShowCondition.notIn': 'Matches when the value is none of these.',
  'ShowCondition.contains': 'Matches when the value is an array that holds this item. Added in 1.4.',
  'ShowCondition.notContains': 'Matches when the value is not an array that holds this item. Added in 1.4.',
  'ShowCondition.notEmpty': 'Matches when the value is not undefined, null, an empty string or an empty array.',
  'ShowCondition.gt': 'Matches when the value is a number, or a numeric string, greater than this.',
  'ShowCondition.gte': 'Matches when the value is a number, or a numeric string, greater than or equal to this.',
  'ShowCondition.lt': 'Matches when the value is a number, or a numeric string, less than this.',
  'ShowCondition.lte': 'Matches when the value is a number, or a numeric string, less than or equal to this.',
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
