# @formhaus/core

## 1.4.0

### Minor Changes

- New `@formhaus/core/fields` entry with helpers for custom field components: `fieldState`, `fieldId`, `fieldAria`, `fieldValue`, `numberValue`, `inputType`, `optionChecked`, `fromDate`, `toDate`, `scaleView`, `optionText`, `optionValue` and `toggleOption`. `toDate` reads every date, datetime and time value core accepts and gives `null` for an impossible date such as `2026-02-31`. The main entry does not change.
- `SectionView` has `columns`, `FormActionsView` has `primaryDisabled`, `FormStepProgressView` has `stepErrorsLabel` and `FormStepStatus` has `errorsLabel`.
- New `@formhaus/core/controls` entry with the logic behind `mapControls` in React and Vue, for an adapter in another framework: `toControl`, `fromControl`, `controlKind`, `controlOptions`, `controlProps` and `choiceControl`.
- In production builds, and in a browser without a bundler where `process` is not defined, `FormDefinitionError` from `FormEngine` and `replaceDefinition()` lists `path: code` for each issue, without `hint`. `checkDefinition()`, `parseDefinition()` and development builds keep the full text. `FormEngine` with core is about 1 KB smaller gzipped.

### Patch Changes

- `validateSubmission()` also refuses, and `checkDefinition()` reports as `slow-pattern`, a pattern that repeats a backreference next to overlapping parts or inside a repeated group, such as `(-)(?:a*\1*-)+$` or `(?<s>-)(?:a*\k<s>*-)+$`.
- `validateSubmission()` throws a `FormDefinitionError` with a `slow-pattern` error for a `pattern` that `checkDefinition()` reports as `slow-pattern` or that is longer than 1000 characters, instead of running it on the submitted values. A definition that `validateSubmission()` accepted before can now throw. The engine still runs these patterns and only warns.
- `checkDefinition()` reports `slow-pattern` for a pattern longer than 1000 characters and for repeated groups next to overlapping repeated parts, such as `(ab)+(ab)+`.
- `slow-pattern` no longer reports a repeated group that starts or ends with a character nothing else in the group matches, such as `([\w-]+\.)+` or `(,\s*[a-z]+)*`.

## 1.3.0

### Minor Changes

- New `errorSummary(engine, { idPrefix?, labels? })` returns the engine's field errors grouped by step, its top-level errors and the field error count.
- New types `ErrorSummary` and `ErrorSummaryOptions`.
- `FormRendererHandle` declares `showField(key)` and `getErrors()`.
- New types `RootProps`, `ErrorSummaryView`, `ErrorSummaryGroup`, `FormErrorsView`, `FormStepProgressView` and `FormStepStatus` for renderer layout slots.
- New `legacy-layout` warning code.
- New `locale` option on `FormEngine` takes a `LocaleCatalog` or a list of them. Per key, `messages` wins over `definition.messages`, which wins over the catalogs in array order, which win over the built-in English.
- A catalog text can be an object of plural forms, picked by `Intl.PluralRules` for the catalog locale on `{count}`, `{min}` or `{max}`. That number is formatted with `Intl.NumberFormat` for the same locale.
- Message and label catalogs for `es`, `fr`, `fr-CA`, `de`, `pt-BR`, `it`, `ja`, `zh-CN`, `ru` and `uk`, plus `en`, at `@formhaus/core/locales/<tag>` (typed) and `@formhaus/core/locales/<tag>.json`.
- New `localeChain(tag)` and `checkCatalog(catalog)` in `@formhaus/core/i18n`. `localeChain` adds the likely region, so `zh-Hans-CN` also tries `zh-CN`.
- New types `LocaleCatalog`, `LocaleText` and `PluralForms`.
- A multi-step overlay also accepts `fields.<key>` at the top level. `steps.<id>.fields.<key>` wins when both are set, and `translationIssues()` no longer reports these addresses as unknown.
- A translate function that returns the built-in English text for a message or label key leaves that key to the locale catalogs.
- New `onValidate` engine option runs after the definition rules pass, on Continue after `onStepValidate` and on Submit before `onBeforeSubmit`. It gets the values and `{ stepId, fields, submit }`, where `fields` lists the visible field paths in scope, and returns errors keyed by field path. Keys outside `fields` show as top-level errors.
- An `onValidate` error on another step opens that step on Submit.
- New types `ValidateFn` and `ValidateContext`.
- New `@formhaus/core/schema` entry with `schemaValidate(schema)`, which turns a Standard Schema such as Zod, Valibot or ArkType into an `onValidate` function, and the `StandardSchemaV1` type.
- Form errors from `onStepValidate` and `onValidate` clear on the next Continue, Back, Skip or Submit. Form errors from the submit handler and from `setErrors` stay.
- New `process.env.FORMHAUS_TRUSTED` define. Set to `"1"`, it drops the production structure check from the bundle: `FormEngine` goes from 18.8 KB to 14.0 KB gzipped, `FormRenderer` with core about 4.5 KB less. An invalid definition then fails with a plain runtime error instead of `FormDefinitionError`. Development builds still run `checkDefinition()`.
- In production, `FormEngine` and `replaceDefinition()` skip the structure check for a definition returned by `parseDefinition()`.

## 1.2.3

### Patch Changes

- New `matrix-options-mismatch` warning for a row of a `layout: "matrix"` section whose option values differ from those of the first field. Rows that use `optionsFrom` are not checked.

## 1.2.2

### Patch Changes

- `FormEngine` validation no longer checks the items of a group that has more items than its limit or an item that is not an object. Only the group error is reported.

## 1.2.1

### Patch Changes

- Fixed `subscribeValues` listeners missing a cleared hidden value with `hiddenValues: 'keep'` when `engine.values` had not been read yet.
- Fixed the React `FormActions` throwing when `testIds` is `null`.
- A Vue custom field component gets `testId` and `optionTestId` only when it declares them as props. Other components no longer render `test-id` and `option-test-id` attributes.

## 1.2.0

### Minor Changes

- New `noticeComponent` prop on the React `FormhausForm` and `notice` slot on the Vue one replace the error notice. Both get `notice` and `onAction`.
- New `noticePlacement` prop on `FormhausForm`, `'top'` (default) or `'actions'`. With `'actions'` the notice shows just above the buttons.
- A custom `actionsComponent` of `FormhausForm` receives the notice. In React it gets `notice` and `onNoticeAction`. In Vue it gets `notice` and emits `noticeAction` when it declares a `notice` prop.
- After a failed submission, `FormhausForm` focuses the first element with `data-fh-notice`, else the error summary or the first invalid field.
- New `code` property on `CloudNotice`: a known `CloudError` code, or `form_refreshed` after a new form version loads.
- New `cloudLabels` prop on `FormhausForm` translates the notices by code and the `retry`, `reload`, `submitted` and `submitAnother` texts. It takes a catalog or a function.
- New `CloudNoticeCode`, `CloudNoticeActionFn`, `CloudLabelKey`, `CloudLabelSource`, `FormhausFormActionsProps` and `FormhausFormNoticeProps` types.
- Fixed `FormhausForm` dropping errors thrown by its step and submit hooks before they reached `onError`.
- New `hiddenValues` engine option, `'clear'` (default) or `'keep'`. With `'keep'`, fields hidden by conditions keep their values in `engine.values` and in submitted values.
- With `'keep'`, conditions, validation and recall still treat hidden fields as unanswered, and hidden fields never block Continue or Submit.
- With `'keep'`, submitted values also hold the answers on steps off the active path. Fields of skipped steps stay out.
- `validateSubmission()` takes the same `hiddenValues` option. With `'keep'`, it checks hidden values like visible ones except `required`, and drops one that fails without an error.
- New `hiddenValues` prop on `FormRenderer` and `HeadlessFormRenderer`, and option of `useFormEngine`.
- `capabilities` in `@formhaus/mcp` describes `hiddenValues`.
- New `testIds` prop on `FormRenderer` and `HeadlessFormRenderer` adds `data-testid` attributes. It is off by default.
- `testIds={true}` names elements after the definition id: `signup.form`, `signup.email`, `signup.plan.pro`, `signup.people.0.name`, `signup.submit`, `signup.next`, `signup.back` and `signup.summary`.
- A `testIds` function receives a `TestIdTarget` and returns the id.
- New `TestIdTarget` type.
- Custom field components receive `testId` and `optionTestId`. Custom actions components receive `testIds`.

## 1.1.1

### Patch Changes

- `FormhausForm` loads the bot check as soon as the form shows instead of on first focus.
- New `challengeWait` option on `CloudSubmitOptions` sends the milliseconds a submission waited for the bot check. `FormhausForm` sets it.
- The primary button shows a spinner when it stays busy for more than 800 ms, and no longer fades while busy. With reduced motion the spinner does not turn.

## 1.1.0

### Minor Changes

- Format 1.6: `"randomize": true` on a `radio`, `multiselect` or `select` field shows its options in a random order per respondent. Options with `"pinned": true` and exclusive options keep their written position.
- New `@formhaus/core/research` entry with option randomization. Pass its `research` object to apply the order. Without it, options show in written order, and development builds report `missing-research` once per page load through `onWarning`.
- New `research` and `seed` props on `FormRenderer`, `HeadlessFormRenderer` and `useFormEngine`, and engine options of the same names. The same seed shows the same order. `engine.seed` returns it.
- New `engine.orderOptions(key, options?)` returns the options of a field in shown order.
- Without `seed`, server rendering and hydration show the written order, and the shuffle applies after mount.
- `checkDefinition()` reports `randomize-not-applicable`, and `outdated-format-version` for `randomize` or `pinned` below format 1.6.
- `suggestFixes()` offers to remove `randomize` and `pinned` where they do not apply.
- `capabilities` in `@formhaus/mcp` describes `randomize`, `pinned` and the research module.

## 1.0.1

### Patch Changes

- On screens up to 480px wide the primary button comes first and the Back button spans the full width below it.

## 1.0.0

### Major Changes

- First stable release. No API changes from 0.22.0.
- The public API and definition format 1.5 are stable: no breaking changes in 1.x.

## 0.22.0

### Minor Changes

- Upgrade guide: [Migrate to 0.22](https://formhaus.dev/migrate/0.22).
- **Breaking:** `validateDefinition` is removed. Use `checkDefinition()`.
- **Breaking:** `FormAnalyticsEvent` is removed. Use `FormEvent`.
- **Breaking:** `SubmitFn` is renamed to `AfterSubmitFn`.
- **Breaking:** `ValidationRule` is removed. `getDefaultMessage()` takes a `MessageKey`.
- **Breaking:** `parseDefinition(input)` no longer takes a second argument.
- **Breaking:** `validateFieldValue(field, value, values, { validators, messages })` takes an options object.
- **Breaking:** `validateFields(nodes, values, { validators, messages })` takes an options object.
- **Breaking:** `validateStep(step, values, { validators, messages })` takes an options object.
- New `ValidateOptions` type.
- **Breaking:** `form_submit_failed` also fires with `reason: 'validation'` when Submit fails client validation, before the `field_error` events.
- `form_submit_failed` with `reason: 'error'` carries the numeric `status` of the thrown error. `CloudError` has `status: 0` without a response.
- **Breaking:** `invalid-range` is split into `min-greater-than-max`, `default-items-greater-than-max`, `group-item-limit` (warning) and `invalid-columns`.
- **Breaking:** `missing-label` replaces `empty-label` and the `missing-property` warning for a missing `label`. Its path points to the `label` property.
- **Breaking:** `i18n-unbound-slot` is renamed to `i18n-key-without-text`.
- `FormActionsView`, the props of a custom actions component, is exported from `@formhaus/core`.
- `FormRendererHandle` has a `values` property.
- **Breaking:** `fetchForm(options, signal, after)` is now `fetchForm({ ...options, signal, version })`.
- **Breaking:** `fetchDefinition` is removed from `@formhaus/core/cloud`. Use `fetchForm()`.
- **Breaking:** `createSubmitter(options)` returns `submit(values, { skippedSteps, challengeToken })`.
- **Breaking:** `createChallengeFrame({ challenge, formId, host, timeout, quiet })` takes one options object.
- **Breaking:** `sessionDraftStore({ maxAge, storage })` takes an options object.
- **Breaking:** `new CloudError({ status, code, errors, version, cause })` takes one options object.
- `CloudError.code` is typed as `KnownCloudErrorCode | (string & {})`. New `KnownCloudErrorCode` lists the codes Cloud sends. A later version can add codes.
- `file_taken` and `origin_not_allowed` from Cloud get their own messages instead of the paused-form and generic messages.
- `FormhausForm` uploads a file again and resends once when Cloud reports `file_taken`.
- A stored draft is read back only when it is a well-formed object for the current form version, and only with the keys of fields that the current definition lets a draft hold.
- A draft that fails to save, such as over the storage quota, is deleted instead of keeping older answers.
- New `FetchFormOptions`, `CloudSubmitOptions`, `CloudSubmitFn`, `ChallengeFrameOptions`, `SessionDraftStoreOptions` and `CloudErrorInit` types.
- `@formhaus/core/internal` is documented as private, with no semver guarantee.
- New `engine.goToStep(stepId)` opens a step the user could reach and otherwise opens the previous available step. It returns `GoToStepResult` and reports `step_redirected` when the target was not reached.
- New `step_redirected` form event, `GoToStepResult` and `StepRedirectReason` types. `FormRendererHandle` has `goToStep()`.
- From 1.0, the `--fh-*` variables listed in the theming docs and the class names listed under Stable names do not change within a major version.
- **Breaking:** `--fh-auto-*` and the other private custom properties of `style.css` start with `--fhi-`: `--fh-x`, `--fh-check`, `--fh-plus`, `--fh-zoom`, `--fh-star`, `--fh-star-fill`, `--fh-mask`, `--fh-columns`, `--fh-matrix-columns`, `--fh-matrix-label`, `--fh-matrix-row` and `--fh-scale-points` are renamed.

### Patch Changes

- `verification_failed` and `verification_timeout` errors now have `action: 'retry'` and `retryable: true`, to match their message. `FormhausForm` shows a "Try again" button for them that runs the bot check again.

## 0.21.2

### Patch Changes

- A group starts with at most `maxLength` items, or 100 without `maxLength`, whatever its `defaultItems`.
- Groups hold at most 1000 items, whatever `maxLength` says.
- `checkDefinition()` warns with `invalid-range` when `defaultItems` is greater than 100 on a group without `maxLength`, or when a group's `maxLength` or `defaultItems` is greater than 1000.
- One validation tests at most 10,000 values against patterns. After that, `pattern` fails with its error.
- `validateSubmission()` and the engine stay linear on forms with thousands of steps or chained show conditions across steps.
- `checkDefinition()` reports `slow-pattern` for more overlapping repeats, including runs split by optional parts or groups.
- A pattern whose test throws now fails validation instead of passing.
- New `recall-untrusted-source` warning for a `{{key}}` token that recalls a `hidden` field with a `referrer` or `pageTitle` source.
- Importing a single hook or component from `@formhaus/react` no longer pulls in the whole adapter. An app that uses only `useFormEngine` drops from 29.4 KB to 17.7 KB gzipped, and `@formhaus/vue` from 22.9 KB to 17.7 KB.
- The ES module files in `dist` are no longer minified. Bundlers minify them as before. `server.iife.js` stays minified.

## 0.21.1

### Patch Changes

- Input, scale box and option card borders are softer by default: `#b1b8c2` light and `#444b53` dark at rest, `#8e959f` light and `#5e656d` dark on hover.
- Under `prefers-contrast: more` these borders keep the higher-contrast values: `#84848d` light and `#73737d` dark at rest, `#5f5f68` light and `#9a9aa5` dark on hover.
- New `--fh-color-input-border-strong` and `--fh-color-input-border-strong-hover` custom properties hold the higher-contrast values.
- To always use the higher-contrast borders, set `--fh-color-input-border` and `--fh-color-input-border-hover`.
- Option images with a `javascript:`, `data:` (other than png, jpeg, webp or gif), `file:` or credential-bearing URL are not rendered.
- `checkDefinition()` reports `slow-pattern` for adjacent repeated parts that overlap, such as `\d*\d*x`.

## 0.21.0

### Minor Changes

- Format 1.5. Core 0.20 and older reject definitions that use `{{key}}` tokens, exclusive options or `autocomplete`.
- `{{key}}` in a text shows the answer of an earlier field. Below format 1.5 the braces show as written.
- Tokens work in step and section `title` and `description`, field and group `label` and `helperText`, `placeholder` and group `itemLabel`. Inside a group item, a token also reads the item's own fields.
- A token shows an option label, a number, a date, text, file names, or the item count of a group. A checkbox or switch shows its label when on.
- A missing answer, a hidden field, a `password` field and an unknown key show nothing. The result is plain text.
- When route branches share a key, a token reads the field on the active path. A key that is a `password` on any branch shows nothing.
- Recalled dates, times, numbers and lists are formatted for the locale with `Intl`. A stored date shows its own day in every time zone.
- Token keys may hold letters, digits, `_`, `-` and `.`. A token with any other content shows as written. `\{{` shows literal braces.
- A text with tokens, and a message or label filled with parameters, is cut to 10000 UTF-16 code units.
- New `formatRecall` and `lang` engine options. `formatRecall` replaces the formatting of recalled answers. `lang` wins over the definition `lang`, and both fall back to `en`.
- New `recallText()` resolves a text against answers. Its `engine` option follows the engine's active path.
- New `recallStatic()` replaces each token with the label of its field, for texts shown outside one submission.
- New `RecallFormatFn` and `RecallOptions` types.
- A `multiselect` option with `"exclusive": true` is the only answer when picked, as in "None of these". Picking another option clears it.
- An exclusive option alone satisfies `required` and skips `minLength`.
- A list with an exclusive option and any other value fails with the new `exclusive` message, default `Select "{option}" or other options, not both`.
- A field takes `autocomplete`, an HTML autofill token such as `given-name`, `email` or `off`.
- New labels `or` (`or`), shown before exclusive options, and `select` (`Select`), for the empty prompt of a select.
- New `checkDefinition()` warnings: `unknown-recall-field`, `recall-forward-reference`, `recall-syntax`, `recall-sensitive-field`, `recall-query-source`, `exclusive-not-applicable`, `exclusive-option-position`, `exclusive-default-value`, `exclusive-with-min-length`, `unknown-autocomplete-token` and `autocomplete-not-applicable`.
- `checkDefinition()` warns with `outdated-format-version` about these features without `"formatVersion": "1.5"`.
- `translationIssues()` reports a translation that drops or adds a `{{key}}` token.
- `textSlots()` lists the `or` and `select` labels and the `exclusive` message only for forms that use them.
- A line break in a step or section `description` or in `helperText` shows as a line break.
- **Breaking:** `validateSubmission()` no longer returns a value that fails its type check in `values`, at top level and in group items.
- `validateSubmission()` treats a value that fails its type check as unanswered in conditions, and custom validators no longer receive it.
- Radio and multiselect option cards draw their border with `--fh-color-input-border`.

### Patch Changes

- `validateSubmission()` no longer reports a field in a group item as required when an invalid answer in the same item hid it and was then dropped.

## 0.20.2

### Patch Changes

- New `--fh-color-input-border` and `--fh-color-input-border-hover` custom properties.
- Text inputs, textareas, selects, date, time and file fields, scale boxes and the switch track use `--fh-color-input-border` instead of `--fh-color-border`.
- The default input border is darker for WCAG 1.4.11 contrast: `#84848d` light and `#73737d` dark, 3.7:1 against the background. To restore the old look, set `--fh-color-input-border` to `#d4d4d8` (dark: `#3a3a41`) and `--fh-color-input-border-hover` to `#a1a1aa` (dark: `#5a5a63`).
- Under `prefers-contrast: more`, `--fh-color-border`, `--fh-color-border-hover` and `--fh-color-secondary-border` use the input border colors.
- The package ships the design tokens as DTCG JSON in `@formhaus/core/tokens/`, with light and dark, fine and coarse pointer, regular and compact width, and standard and increased contrast modes.

## 0.20.1

### Patch Changes

- Autocomplete options that share a label are listed as `Label (value)`, and picking one submits its own value. Texts that still repeat get a number, as in `Label (value) (2)`.
- `contains` and `notContains` check up to as many selected items as the field allows, so a list of more than 1000 valid options still matches.

## 0.20.0

### Minor Changes

- New `contains` and `notContains` condition operators test one item of an array value, like a `multiselect` answer. They work in `show`, `showAny`, routes and `disabled`.
- `contains` never matches a value that is not an array. `notContains` matches whenever `contains` does not, including before the question is answered.
- New warnings `contains-not-list` for `contains` or `notContains` on a field that does not hold a list, and `contains-not-in-options` for a value that is not one of the field's options.
- Format version 1.4. Core 0.19 and older reject definitions that use `contains` or `notContains`.
- `checkDefinition()` warns with `outdated-format-version` about `contains` or `notContains` without `"formatVersion": "1.4"`.
- New labels `clear` (`Clear`), `done` (`Done`), `chooseFile` (`Choose file`), `required` (`required`), `skip` (`Skip`), `submit` (`Submit`), `stepTitle` (`Step {index}`) and `stepErrors` (`Errors: {count}`).
- The Skip button uses the `skip` label when the step `skip` action has no label.
- The final Submit button uses the `submit` label when the `submit` action has no label.
- The step progress names a step without a title with `stepTitle`.
- **Behavior change:** the step progress marks a step with errors as `· Errors: 2` instead of `· 2 errors`. Change it with the `stepErrors` label.
- **Behavior change:** the error summary sits below the fields and form-level errors, above the step buttons.
- The error summary groups errors under each step's title when they come from more than one step.
- The step progress shows the current step's title in the error color while the step has errors, with the `stepErrors` label as visually hidden text.
- A custom progress component receives `stepErrorCount`, the number of errors on the current step.
- New `.fh-error-summary__step` class styles the step names in a grouped error summary.
- `FormActions` and `FormStepProgress` use the renderer `labels` and `definition.labels` for their fallback texts.
- `clear`, `done`, `chooseFile` and `required` are for native renderers. The web renderers do not show them.
- `textSlots()` and `translationTemplate()` list each new label only when the form uses it.
- `translationIssues()` reports these labels as missing from existing translations of forms that use them.
- A custom actions component receives `skipLabel`.
- New `engine.replaceDefinition(definition)` switches a running form to a new definition and keeps the answers, the current step and the errors that still fit.
- New `keepValues` prop on `FormRenderer` and `HeadlessFormRenderer` keeps the answers when the `definition` prop changes. Without it, a new definition still resets the form.
- `useFormEngine` in React and Vue takes `keepValues` in its options. The new `UseFormEngineOptions` type describes them.
- A value is kept when the new definition has a field with the same key and type. Values of removed fields and of fields whose type changed are dropped.

### Patch Changes

- Error summary entries join a label that ends with `?`, `!`, `:`, `.` or their full-width forms to its message with a space instead of `: `.
- Cloud forms keep `scale` and `rating` answers when the form is updated during submit. An answer outside the new range is dropped.
- Submissions with duplicate options now fail validation. A `multiselect` value that repeats an option, including in a matrix row or a group item, gets the `options` message from `validateSubmission()` and the engine.
- Matrix sections switch to the table layout from 480px wide instead of 560px, so a matrix inside a 640px card is a table.
- `replaceDefinition()` no longer lets a second submit start while the first is in flight.
- `validateSubmission()` treats a `multiselect` value that is not a list or has more items than allowed as unanswered when it evaluates conditions. Large submitted arrays no longer slow down condition checks.
- `validateSubmission()` applies the same limit to `multiselect` answers inside group items.

## 0.19.1

### Patch Changes

- Matrix sections 560px wide or more are a table: each row label and its radios share one line under centered column labels.
- Narrower matrix sections show the column label under each radio, with no header row.
- Matrix rows have 48px rows, hairline separators, a row highlight on hover and focus, and whole-cell click targets.

## 0.19.0

### Minor Changes

- **Breaking:** Minimum Node is `22.12`.
- New `scale` field type: one integer point from `validation.min` to `validation.max`, 1 to 5 by default. `0` on a 0-based scale counts as an answer.
- New `rating` field type: 1 to `validation.max` stars, 5 by default. `validation.min` is an ordinary "at least" rule.
- `scale` and `rating` reject values that are not whole numbers in range with the `option` message.
- `validateSubmission()` converts decimal strings such as `"7"` to numbers for `scale` and `rating`, as it does for `number`.
- `options` on `scale` and `rating` are anchor labels, not choices. Conditions on these fields compare numbers.
- New `image` on options of `radio` and `multiselect` fields.
- **Behavior change:** `getDefaultMessage()` and the default errors use new texts for length and item limits. `Must be at least {min} characters` → `Minimum length is {min}`, `Must be at most {max} characters` → `Maximum length is {max}`, `Must be at least {min} items` → `At least {min} required`, `Must be at most {max} items` → `At most {max} allowed`. With a `unit`, `Must be at least {min} {unit}` → `At least {min} {unit}` and `Must be at most {max} {unit}` → `At most {max} {unit}`. The conformance fixtures expect the new texts.
- New labels `enlargeImage` (`Enlarge image: {label}`) and `close` (`Close`) for the picture preview. `textSlots()` lists them for forms with option images.
- New `columns` on fields sets picture cards per row, from 1 to 4. `checkDefinition()` rejects other values and warns with `columns-not-applicable` when the options have no images, the field is not `radio` or `multiselect`, or the field is in a matrix section.
- New `layout: "matrix"` on sections.
- A step or section may have an empty `fields` array, for a welcome screen or a statement.
- Format version 1.3. `checkDefinition()` warns with `outdated-format-version` about `scale` or `rating` without `"formatVersion": "1.3"`.
- **Breaking:** `rating` and `scale` are built-in type names now. A custom field type named `rating` or `scale` gets the built-in checks, and the built-in renderer when `components` has no entry for it. Rename it with a dash, such as `x-rating`.
- **Breaking:** `DefaultFieldType` adds `scale` and `rating`, so an exhaustive `Record<DefaultFieldType, …>` must list them.
- `unknown-field-type` reports a type with `-` or `:` only when it spells a built-in type with separators, such as `multi-select`. `x-rating` is no longer reported as a typo of `rating`.
- `style.css` styles scale, rating, picture options, matrix sections and steps without fields.
- New theme tokens `--fh-icon-button-size` (32px), `--fh-star-size` (32px, 40px on touch screens), `--fh-option-image-width` (200px) and `--fh-shadow-raised`.
- `style.css` wraps scales of 8 to 11 points into two rows when 44px points do not fit, and places rating stars 4px apart with 44px hit areas on touch screens.

### Patch Changes

- `FormhausForm` uploads a file again and resubmits once, without user action, when Formhaus Cloud answers "Upload the file again." for an expired upload.
- The resubmit asks for a new bot check token and does not show the first attempt's error.
- `validateSubmission()` checks the definition once per call instead of once per internal pass, so it runs faster in every build.
- `next()`, `back()`, `skip()` and `submit()` return `false` when a shown field that was empty when a hook started gets a value while the hook is pending, for example when the respondent answers it. Before, they went ahead with the values the hook saw. Values written into empty `hidden` fields, such as captcha or lead tokens, do not cancel the action.
- Group items that are not objects get distinct ids when they are edited. Before, every such item had the id `0`, which gave duplicate list keys in React and Vue.
- `checkDefinition()`, the `FormEngine` constructor and `validateSubmission()` reject a `scale` or `rating` whose `min` or `max` is not an integer, or whose range has fewer than 2 or more than 11 points, with the new `invalid-scale` error. `rating` `max` must be 2 to 11.
- `checkDefinition()` warns with the new `unsafe-image-url` code about an option `image` that does not start with `https:` or `data:image/`.
- `ScaleField` draws at most 11 points.
- Option images and the enlarged preview load with `referrerpolicy="no-referrer"`.

## 0.18.0

### Minor Changes

- `CloudSubmission` has `ending` when Formhaus Cloud picks an ending for the submission.
- `FormhausForm` shows that ending. Its message or redirect replaces the form's success settings.
- `FormhausForm` uploads the file of each `file` field to Formhaus Cloud before it submits and sends the upload id as the field value. A refused or failed upload shows its message on the field.
- `style.css` styles the file input and its button with the theme tokens.
- `FormhausForm` waits up to 14 minutes for a file upload.
- New `onFormEvent` option reports form lifecycle events from `FormEngine`.
- New `start()` method reports `form_viewed` and the first `step_viewed` once per engine.
- `step_viewed` fires after `start()` on every change of the current step, including `goToStepWithField` and `reset()`.
- New `field_shown` and `field_hidden` events fire when a field's condition result changes. Group item fields report their path.
- New `form_submit_succeeded`, `form_submit_failed` and `form_reset` events. `form_submit_failed` has `reason: 'rejected' | 'error'`.
- An error thrown by `onFormEvent` is rethrown in a microtask and does not interrupt the action.
- New `FormEvent` type. `FormAnalyticsEvent` is an alias of it.

## 0.17.0

### Minor Changes

- New `createChallengeFrame()` in `@formhaus/core/cloud` runs the Formhaus Cloud bot check in a frame loaded from the form's `challenge.url`.
- `token()` on the frame resolves to the bot check token, or to `undefined` when the frame cannot load.
- `warm()` loads the frame early, `spend()` makes the next `token()` run a new check, and `dispose()` removes the frame.
- New `CloudChallenge`, `ChallengeHost` and `CloudChallengeFrame` types.
- Submitters from `createSubmitter()` take the bot check token as a third argument.
- Submitters from `createSubmitter()` send the `utm_source`, `utm_medium`, `utm_campaign`, `utm_term` and `utm_content` parameters of the page address with each submission. Each value is cut to 100 characters.
- `PublishedForm` has `challenge` when Formhaus Cloud has the bot check on.
- New messages for the `verification_failed` and `verification_required` errors and for a bot check that takes too long.
- `style.css` applies the theme tokens and dark theme to `.fh-cloud`.

### Patch Changes

- Fixed a retry after a timeout creating a second submission when the bot check token was refreshed.

## 0.16.0

### Minor Changes

- New `subscribeValues()` and `getValuesSnapshot()` on `FormEngine`.

## 0.15.0

### Minor Changes

- **Breaking:** A field shown again gets back its last value, including `''`, `null` and `false`.
- **Breaking:** A field that starts hidden gets its initial value or `defaultValue` when it is shown.
- **Breaking:** A group shown again gets back its last items, or else its initial items, instead of `defaultItems` new items.
- **Breaking:** An item in the initial values or in `reset(values)` gets the `defaultValue` of the item fields it leaves out.
- **Breaking:** `validateSubmission()` no longer fills the `defaultValue` or `defaultItems` of a key missing from the payload.
- Fields accept `props`, an object of settings for a custom field type. Renderers pass it to the component as `field.props`.
- Definition format 1.2 adds `props`. `FORMAT_VERSION` is `"1.2"`.
- Format 1.0 and 1.1 definitions are still accepted and follow the 0.15 runtime behavior.
- New `custom-type-name` warning for a custom field type without `-` or `:`. Names with `-` or `:` never become built-in types.
- New `condition-always-true` warning for `notEmpty: false` in a condition, which matches every value.
- New `disabled-not-applicable` warning for `disabled` on a `back`, `skip` or `cancel` action, which the built-in renderers ignore.
- New `definition-reset` and `missing-component` issue codes for the React and Vue development warnings.
- A `hidden` field no longer needs a `label`. Its type is `HiddenFormField`.
- `OptionsProvider` is exported from `@formhaus/core`.
- Fixed `validateSubmission()` skipping the rules of, or dropping, a field shown by the defaults of a skipped step.
- Fixed `FormEngine` throwing when a `process` shim has no `env`.

### Patch Changes

- Fixed a key declared on two routes taking its `defaultValue`, `defaultItems` and item defaults from the route the form is not on.

## 0.14.2

### Patch Changes

- Fixed `FormhausForm` with `initialForm` showing empty fields instead of the saved draft.

## 0.14.1

### Patch Changes

- Fixed `require('@formhaus/core/fix')` failing with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
- Fixed group items that are not plain objects, such as `null` or a string in the initial values, passing client validation and reaching `onSubmit` as `{}`.
- A group with such items fails with `Invalid value` in the browser, as in `validateSubmission()`.
- Fixed `validateSubmission()` checking a value against a group on an inactive branch when another branch reuses the key.
- Fixed fields in one group item getting the same DOM id when their keys differ only in punctuation, such as `contact.email` and `contact-email`. The second error summary link focused the first field.
- Fixed a section and a field getting the same DOM id when their keys differ only in punctuation.

## 0.14.0

### Minor Changes

- New `@formhaus/core/fix` entry with `suggestFixes()`, `applyFix()` and `fixAll()`. The main entry does not include it.
- `suggestFixes()` attaches `fixes` to definition issues it can repair. Each fix is `{ title, safe, patch }` with an RFC 6902 JSON Patch.
- `applyFix()` returns a new definition and throws on a patch path that does not exist.
- `fixAll()` applies every safe fix and returns the definition, the applied fixes and the issues left.
- **Breaking:** `checkDefinition()` and `FormEngine` reject a field whose options repeat a value, with the new `duplicate-option-value` error.
- New `source` on `hidden` fields: a URL parameter (`{ "query": "utm_source" }`), `referrer`, `page`, `pageTitle`, `language`, `timezone`, `device` or `country`.
- New `resolveSources(definition, context)` returns the values of sourced hidden fields for a page context.
- `checkDefinition()` reports an unknown source as `unknown-source`, a malformed one as `invalid-type`, and a `source` on another field type as the `source-not-applicable` warning.
- `hidden` values without `maxLength` are capped at 2000 characters in the browser and in `validateSubmission()`.
- `FormhausForm` and `@formhaus/core/cloud` load and submit forms through api.formhaus.cc by default. Add it to your CSP `connect-src` if you use an allowlist; api.formhaus.dev keeps working.
- Definition format 1.1 adds `section` nodes: a titled block of fields with shared `show`/`showAny`. Fields inside keep their top-level keys in the payload.
- Definition format 1.1 adds `group` nodes: repeatable items submitted as an array of objects, with `required`, `minLength` and `maxLength` counting items.
- New `FormEngine` methods `items()`, `addItem()`, `removeItem()` and `setItemValue()`, and the `visibleNodes` getter.
- `setValue()`, `validateField()`, `setErrors()` and submit results accept item paths such as `participants.1.email`.
- `validateSubmission()` checks every group item, drops unknown item keys and reports item errors by path.
- `checkDefinition()` reports `group-scope` and `invalid-nesting`, and warns with `outdated-format-version` about sections or groups without `formatVersion` 1.1.
- New label keys `addItem`, `removeItem`, `itemLabel`, `itemAdded`, `itemRemoved`, `removeItemNamed`, `removeItemPrompt`, `removeItemBody` and `cancel`, and translation addresses for sections, groups and item fields.
- New `isSection()` and `isGroup()` helpers and `FormSection`, `FormGroup`, `FormNode`, `GroupValidation`, `GroupI18n` and `GroupItem` types.
- **Breaking:** `FormStep.fields` and `FormDefinition.fields` are typed `FormNode[]`. Code that walks them must handle sections and groups.
- **Breaking:** Errors of item fields use paths such as `participants.1.email` as keys in `errors` and `stepErrors`.
- **Breaking:** custom field types named `section` or `group` are now built-in nodes.
- Upgrade the server that runs `validateSubmission()` before the clients. Older servers pass group values through unchecked.
- Visible changes in `style.css`:
  - Step titles are 20px (were 18px). Step titles and section headings follow the new `--fh-font-size-title` and `--fh-font-size-heading` variables.
  - Placeholders and checkbox and radio borders are darker and meet WCAG AA contrast.
  - Helper text sits 4px under its label. Helpers and errors of checkboxes and switches line up with the label text instead of the box.
  - Headings, helpers and errors wrap more evenly.
  - Every margin, padding and gap comes from the new `--fh-space-1` to `--fh-space-10` variables, and group cards use `--fh-card-padding`.
- New `time` field type. The browser and `validateSubmission()` accept 24-hour `HH:mm` or `HH:mm:ss` and reject other values with the new `time` message, `Enter a valid time`.
- New `hidden` field type. Its value comes from `defaultValue` or the initial values, and `validateSubmission()` checks it as text.
- An error on a `hidden` field is a form-level error. `topLevelErrors` lists it, `stepErrors` leaves it out and a failed submit does not move to its step.
- Built-in messages on a `hidden` field name the field through the new `hidden` message template, `{label}: {message}`. Custom messages stay as written.
- Server errors for the key of a `hidden` field are form-level errors too.
- A `hidden` field that its conditions show again gets its initial value or `defaultValue` back. Other field types still start empty.
- `time` and `hidden` are new keys in `messages` catalogs and in the translation JSON Schema.
- **Breaking:** `time` is a built-in type. A custom `time` type now fails values that are not 24-hour `HH:mm` or `HH:mm:ss`.
- **Breaking:** `hidden` is a built-in type. A custom `hidden` type now fails values that are not text, and its errors move to `topLevelErrors`.

### Patch Changes

- `checkDefinition()` warns about a `pattern` with nested quantifiers, such as `(a+)+`, with the new `slow-pattern` code.
- A value longer than 10,000 characters fails `pattern` without being matched.
- A missing required property is reported as `missing-property` with the path of the object that lacks it, such as `/: missing required property "id".` A present value of the wrong type is reported as `invalid-type`.
- `checkDefinition()` warns about unknown properties with the new `unknown-property` code and names the closest known property, such as `Did you mean "id"?`. The engine still ignores unknown properties.
- `checkDefinition()` warns about a missing step `title`, field or option `label`, or action `label`, and about an empty `label` on a visible field with the new `empty-label` code.
- Fixed saved drafts of hosted forms keeping a password when another branch uses the same key for a text field.
- CommonJS code can `require()` the packages on Node 20.19+ and 22.12+. Before, `require()` failed with `ERR_PACKAGE_PATH_NOT_EXPORTED`.

## 0.13.2

### Patch Changes

- 5752683: - Fixed `translationTemplate()` and `textSlots()` listing a `validation.required: ""` rule as translatable. A translation for it made the field required. `translationIssues()` now reports it as unknown.

## 0.13.1

### Patch Changes

- a5c775e: - `setValue()`, `next()` and `back()` take 0.2 ms instead of 0.5 ms on a 50-step, 970-field form.
- 49485c8: - Fixed a rejected final Skip overwriting answers given while it was pending.
- 1a4874a: - Fixed a cancelled final Skip restoring old answers and server errors over a newer submission when its response arrived late.
  - Fixed `stepErrors` for steps with ids such as `constructor` and `__proto__`. `stepErrors` is now an object without a prototype.
  - `validateSubmission()` treats an empty array in a built-in field other than `multiselect` as a missing answer and leaves it out of the returned values.
  - An optional field with an empty array passes `validateSubmission()`.
  - A required field with an empty array fails `validateSubmission()` with the required message instead of a type error.
- 5ea6229: - Fixed a rejected or cancelled final Skip keeping the step skipped and its answers cleared when an answer changed while it was pending.

## 0.13.0

### Minor Changes

- fe4a968: - New `lang`, `messages` and `labels` definition properties. `messages` replaces the built-in validation messages, with `{min}` and `{max}` filled in.
  - New `i18n` objects on the definition, steps, fields, options, actions and `validation` map texts to translation keys of the app. The texts stay as the fallback.
  - New `messages` option of `FormEngine` and `validateSubmission()`, an object of templates or a function.
  - Field messages win over the `messages` option, and the `messages` option wins over `definition.messages`.
  - `validateFieldValue()`, `validateFields()` and `validateStep()` take an optional `messages` argument after `validators`.
  - `getDefaultMessage()` accepts every message key, including `minItems`, `maxItems`, `email` and `date`.
  - New `@formhaus/core/i18n` entry with `localize()`, which applies a translation file or a translate function such as i18next `t`.
  - New `defaultMessages` and `defaultLabels` in `@formhaus/core/i18n` hold the English templates.
  - New `translationTemplate()`, `textSlots()` and `translationIssues()` in `@formhaus/core/i18n` for translation files.
  - New JSON Schema for translation files at `@formhaus/core/translation.schema.json` and https://formhaus.dev/schema/form-translation.json.
  - New `checkTranslations()` in `@formhaus/core/i18n` reports `i18n-unbound-slot` (error), `unknown-i18n-slot`, `unknown-message-key`, `unknown-label-key` and `i18n-unsafe-identifier` (warnings). `localize()` throws on its errors.
  - Definitions that use `lang`, `messages`, `labels` or `i18n` fail the JSON Schema of 0.12 and earlier. Older cores ignore these properties.
  - `lang`, `messages` and `labels` are reserved. `FormEngine` ignores `messages` and `labels` entries that are not strings.

## 0.12.0

### Minor Changes

- 9298412: - The submit handler can return `{ ok: true }` or `{ ok: false, errors, formErrors }`. A rejection keeps the answers, shows the errors and does not run `onAfterSubmit`. Handlers that return nothing, or anything other than a plain object with `ok: false`, work as before.
  - New `SubmitResult` and `SubmitHandler` types. The renderers' `onSubmit` prop is typed `SubmitHandler`, which accepts every `SubmitFn`.
  - Server errors from a rejection or `setErrors()` stay through step navigation and validation of other fields. Editing a field removes only that field's error.
  - `setErrors()` and a rejection open the earliest step with an error, whatever the key order.
  - A successful submission clears server errors and form-level errors.
  - `onStepValidate` errors no longer remove server errors on other steps.
  - A submit response that arrives after `reset()`, `cancelPendingActions()` or an unmount is ignored. Errors for fields edited during the request are dropped.
  - New `engine.stepErrors` lists the fields with errors by step.
  - New `errorSummary` renderer prop lists every field error with a link that opens its step and focuses the field.
  - New `stepErrorMarks` renderer prop lists the steps under the progress bar and marks the steps with errors. Custom progress components receive the list as `steps`.
  - The form-level error banner has `role="alert"`.
  - The renderers focus the first invalid field after a failed Continue.

## 0.11.3

### Patch Changes

- 5daae4d: - `show`, `showAny` and step `routes` conditions compare trimmed text answers. `" yes "` matches `eq: "yes"` and a text answer with only spaces fails `notEmpty`, the same as in `validateSubmission()`.
  - `checkDefinition()` and the `FormEngine` constructor report `invalid-type` when a validation `*Message` is not a string or `required` is not `true`, `false` or a string.
  - The MCP `simulate_path` tool lists visible fields from trimmed text answers.

## 0.11.2

### Patch Changes

- 434db0c: - `validateSubmission()` accepts answers when fields on route branches that never meet share a key with different types. Only the field on the active path is type-checked.
  - `validateSubmission()` accepts any value for an `optionsFrom` field, as the browser does, also when the field has static `options`.
  - `date` and `datetime` values must be real calendar dates. `2026-02-31` fails with "Enter a valid date".
  - `checkDefinition()` and the `FormEngine` constructor report `invalid-type` when a field `label`, `placeholder` or `helperText`, an option `label`, a step `title` or `description`, or an action `label` is not a string.
  - A `__proto__` key in initial values no longer changes the prototype of `engine.values`.
  - New `isActionDisabled(action, values)` returns `true` when every `disabled` condition of the action matches.
- 4fb22ad: - The default theme shows hover states on fields, options and buttons on devices with a mouse.
  - New `--fh-color-control-hover` and `--fh-color-bg-hover` theme variables.
  - Hover no longer replaces the error border on invalid inputs.
  - Transitions turn off under `prefers-reduced-motion`.
- 960d281: - Definitions can declare their format version with `formatVersion`. A core that does not support it reports `unsupported-format-version`.
  - New `FORMAT_VERSION` export names the definition format this core reads.
  - The MCP `capabilities` tool reports the supported definition format version.
- 97441bb: - Text answers are trimmed of leading and trailing spaces before validation and submit. A `required` field with only spaces is empty. Passwords are not trimmed.

## 0.11.1

### Patch Changes

- `FormhausForm` keeps the response when it is sent again right after a "form updated" notice.
- 2d103ac: - `FormEngine` is 8.9 KB gzipped in production builds, down from 10.6 KB.
  - In production builds, and in a browser without a bundler where `process` is not defined, the `FormEngine` constructor runs only the error checks. It no longer passes warnings to `onWarning`, and its errors have no typo suggestions. Call `checkDefinition()` to get warnings in production.

## 0.11.0

### Minor Changes

- d074148: - Two fields may share a key on route branches that never meet on one path. The field on the active path owns the value and its rules.
  - **Breaking:** `show`, `showAny`, route and `disabled` conditions see only the active projection, with or without routes: visible values of earlier steps on the path plus the condition's own step. A field condition on a field of a later step makes the constructor throw. Move the referenced field to the same or an earlier step.
  - **Breaking:** a step `show` or `showAny` on a field of the same or a later step makes the constructor throw in forms without routes too. Move the referenced field to an earlier step.
  - **Breaking:** a condition or `matchField` on a key that is not a field key makes the constructor throw instead of logging a warning. Initial values for such keys no longer affect conditions. Add a field with that key on an earlier step.
  - **Breaking:** without routes, `setValue()` on a hidden field clears the value at once instead of keeping it until a referenced field changes. Read the value only while the field is visible.
  - **Breaking:** validators, `onStepValidate` and lifecycle hooks receive the active projection in forms without routes too, without hidden fields and keys that are not field keys. Read other context from your own state.
  - **Breaking:** a field `key` used twice on one possible path makes the constructor throw instead of logging a warning. Rename one of the fields.
  - **Breaking:** React and Vue evaluate `submit.disabled` against `getSubmitValues()` instead of `engine.values`, and pass the same values as `values` to a custom actions component. Values of fields off the active path or on skipped steps no longer disable Submit.
- 03a5b5f: - `validateSubmission(definition, values, { validators })` runs the named validators you pass. Validators you do not pass are still skipped.
  - `validateSubmission()` reports an error under the `values` key when it receives the whole request body instead of the values.
  - **Breaking:** `engine.validate()`, Continue and Submit run the server type checks in the browser: `email` format with a top-level domain and at most 254 characters, `date` and `datetime` shape, a finite number for `number`, booleans for `checkbox` and `switch`, static option values, and at most 10,000 characters of text. Values that `validateSubmission()` rejects are now rejected before submit. Store valid values, or use a custom field type for other formats.
  - **Breaking:** `NaN`, `Infinity` and numeric strings in a `number` field fail with "Enter a number" instead of passing `min` and `max`. Write numbers with `setValue(key, Number(text))`.
  - **Breaking:** an empty field with `matchField` fails when the field it matches has a value. Make the confirmation field `required` as well if you also want "This field is required".
- 726b3fd: - `FormhausForm` offers "Submit another response" when the form allows it.
  - `FormhausForm` sends the render token and a honeypot field with each submission.
  - New `initialForm` prop on `FormhausForm` renders a form loaded on the server with `fetchForm()` from `@formhaus/core/cloud`, without a request in the browser.
  - New `draftStore` prop on `FormhausForm` keeps unsent answers. `sessionDraftStore()` from `@formhaus/core/cloud` stores them in `sessionStorage`, so they last until the tab closes and at most 7 days, without `password` and `file` fields.
  - New `fetchForm()` in `@formhaus/core/cloud` returns `{ definition, version, settings, renderToken }`.
  - `createSubmitter()` takes `renderToken` and an `extraBody()` callback.
  - A `426 client_outdated` answer fails with code `"client_outdated"` and "This form needs a newer version of this page."
  - **Breaking:** `@formhaus/core/cloud` loads forms from `GET /f/{id}/form?core=<version>` instead of `GET /f/{id}/definition`, and posts to `/f/{id}?core=<version>`. Allow the new path and query if a proxy or content security policy filters requests to `api.formhaus.dev`.
  - **Breaking:** `FormhausForm` shows the form's success message and opens its redirect URL after a submission instead of ignoring them. Pass `success` (React) or the `#success` slot (Vue) to keep your own success handling and skip the redirect.
- e8cdb54: - New condition operators `gt`, `gte`, `lt` and `lte` compare a number, or a numeric string such as a radio option value, with a number operand. Any other value does not match.
  - `checkDefinition()` reports a non-number operand as an error, and a comparison on a `checkbox`, `switch` or `multiselect` field as a warning.
- f1ccf3a: - New `checkDefinition(definition)` in `@formhaus/core` returns `DefinitionIssue[]`: `{ code, severity, path, message, hint }`, with a JSON pointer `path` and errors first.
  - New `parseDefinition(json)` returns the input typed as `FormDefinition`, or throws `FormDefinitionError`.
  - New `onWarning(issue)` option in `FormEngineOptions` receives definition warnings. Without it, warnings go to `console.warn` outside production.
  - New checks: missing `id`, `title` or `submit`; field types that look like typos of a built-in type; `select`, `radio` and `multiselect` without options; `defaultValue` outside `options`; `minLength` above `maxLength` and `min` above `max`; `min`/`max` or `minLength`/`maxLength` on a type they do not apply to; `matchField` and `optionsDependsOn` on unknown keys; conditions in `disabled`; condition values that can never match the field.
  - A route condition on a misspelled key reports an unknown field.
  - **Breaking:** `checkDefinition()` from `@formhaus/core/server` returns `DefinitionIssue[]` instead of `{ errors, warnings }`. Filter by `issue.severity === 'error'` for errors.
  - **Breaking:** the `FormEngine` constructor throws `FormDefinitionError` with `issues` instead of a plain `Error`. Read `error.issues` instead of splitting `error.message` by lines.
  - **Breaking:** a condition must have exactly one operator. `{ field }` without an operator and a condition with two operators make the constructor throw. Keep one of `eq`, `neq`, `in`, `notIn`, `notEmpty`.
  - **Breaking:** an unknown condition key, such as `equals`, makes the constructor throw instead of always matching. Rename it to a known operator.
  - **Breaking:** `evaluateCondition()` returns `false` for a condition without a known operator instead of `true`. Give every condition one operator.
  - **Breaking:** an invalid `pattern`, a show-condition cycle, `minLength` above `maxLength`, `min` above `max`, a missing `submit` and a condition without `field` make the constructor throw instead of logging a warning. Fix the reported path.
  - **Breaking:** a missing form `id`, step `id`, field `key` or field `type`, and a property of the wrong type, such as `in` that is not an array or `options` items that are not objects, make the constructor throw. Fix the reported path.
  - **Breaking:** `validateSubmission()` throws `FormDefinitionError` when the definition has an error. Run `checkDefinition()` before you store a definition.
  - **Breaking:** constructor warnings start with `[formhaus]` and a JSON pointer instead of `[FormEngine]`. Use `onWarning` to collect them.
  - `validateDefinition()` is deprecated and returns the messages of `checkDefinition()`. Use `checkDefinition(definition).filter((issue) => issue.severity === 'error')`. It is removed in 1.0.
  - The JSON Schema requires exactly one operator per condition.
- 31e96b6: - `FormEngine` takes an optional values type: `FormEngine<TValues>`. `values` and `getSubmitValues()` are typed `Partial<TValues>`.
  - **Breaking:** `engine.nextStep()` and `engine.nextStepAsync(reason)` are removed. Use `await engine.next()`, which runs `onStepValidate` and the step hooks and always reports `reason: 'next'`.
  - **Breaking:** `engine.prevStep()` and `engine.prevStepAsync()` are removed. Use `await engine.back()`, which runs the step hooks.
  - **Breaking:** `engine.skipStep()` and `engine.skipStepAsync(submit)` are removed. Use `await engine.skip(submit)`, which runs the step hooks.
  - **Breaking:** `engine.submitAsync(handler)` is renamed to `engine.submit(handler)`.
  - **Breaking:** `values`, `errors`, `topLevelErrors`, `currentStepIndex`, `fieldLoading`, `stepValidating` and `submitting` are read-only. Use `setValue()` instead of `engine.values.x = v`, and `setErrors()` instead of assigning `engine.errors`.
  - **Breaking:** `StepChangeContext.direction` is removed. Use `context.reason === 'back'`.
  - **Breaking:** the second argument of `SubmitFn`, `skippedSteps`, is a required `string[]`. Code that calls a `SubmitFn` or `onAfterSubmit` itself must pass the skipped step ids.
  - `onAfterSubmit(values, skippedSteps)` receives the skipped step ids as a second argument.
  - **Breaking:** the standalone `validateField(field, value, values, validators)` is renamed to `validateFieldValue()`. `engine.validateField(key)` is unchanged.
  - **Breaking:** `isStepVisible()` is removed. Use `isVisible(step, values)`.
  - **Breaking:** `getDefaultMessage(rule: string)` takes `rule: ValidationRule`: `'required'`, `'minLength'`, `'maxLength'`, `'min'`, `'max'`, `'pattern'` or `'matchField'`. Pass one of these values.
  - **Breaking:** `next()`, `back()` and `skip()` resolve to `false` while another action is pending, where the sync `nextStep()` and `prevStep()` moved at once. Call `cancelPendingActions()` first to interrupt a pending action.
- 6a04469: - New `@formhaus/core/internal` entry for renderer plumbing. It has no semver guarantee.
  - **Breaking:** `shouldApplyExternalErrors` is no longer exported from `@formhaus/core`. Import it from `@formhaus/core/internal`.
  - **Breaking:** `createCloudController`, `initialCloudState` and `focusProblem` are no longer exported from `@formhaus/core/cloud`. Import them from `@formhaus/core/internal`, or use `FormhausForm` from `@formhaus/react/cloud` or `@formhaus/vue/cloud`.
  - **Breaking:** the `CloudCallbacks` and `CloudState` types moved from `@formhaus/core/cloud` to `@formhaus/core/internal`. Import them from there.
  - **Breaking:** the `form_abandoned` event is removed from `FormAnalyticsEvent`. It was never emitted. Remove handlers for it.
- a1eb753: - The React main entry starts with `'use client'`, so React Server Components treat it as a client boundary.
  - **Breaking:** `@formhaus/core` is a peer dependency of `@formhaus/react` and `@formhaus/vue` instead of a dependency. Install it next to the adapter: `npm i @formhaus/core @formhaus/react` or `npm i @formhaus/core @formhaus/vue`.
  - **Breaking:** the React peer range is `^18.0.0 || ^19.0.0` instead of `>=18.0.0`. Use React 18 or 19.
  - **Breaking:** the Vue peer range is `^3.3.3` instead of `>=3.3.0`. Upgrade Vue 3.3.0 to 3.3.2 to 3.3.3 or later.
  - **Breaking:** minimum Node is 20 for `@formhaus/core`, `@formhaus/react` and `@formhaus/vue`. Node 18 is end of life.
- 0ba2078: - React and Vue export all 11 built-in fields (`TextField`, `TextareaField`, `SelectField`, `AutocompleteField`, `MultiselectField`, `CheckboxField`, `RadioField`, `SwitchField`, `FileField`, `DateField`, `DateTimeField`) and `defaultFieldComponents`.
  - React and Vue export `FormhausField`, which renders one field with the built-in fields as fallbacks.
  - New `headingLevel` prop on `FormRenderer` and `HeadlessFormRenderer` sets the step title heading, `1` to `6`.
  - **Breaking:** the step title renders as `<h2>` instead of `<h3>`. Pass `headingLevel={3}` (React) or `:heading-level="3"` (Vue) to keep `<h3>`.
  - **Breaking:** React `ActionsComponent` and `ProgressComponent` props are renamed to `actionsComponent` and `progressComponent`. Rename the props.
  - **Breaking:** React `onStepChange(stepId, direction)` is removed. Use `onAfterStepChange(context)` and read `context.toStepId` and `context.reason`.
  - React `onSubmit` is typed `SubmitFn`: `(values, skippedSteps: string[]) => void | Promise<void>`.
  - **Breaking:** Vue `@submit` is the submit handler instead of a notification after `submitHandler`: it is awaited and receives `(values, skippedSteps)`. Move the saving code from `:submit-handler="save"` to `@submit="save"`, and move code that reacted to the old `@submit` notification to `:on-after-submit`. When both are passed, `@submit` wins and `submitHandler` is ignored. `submitHandler` is deprecated and removed in 1.0.
  - **Breaking:** Vue `stepChange` event is removed. Use the `onAfterStepChange` prop and read `context.toStepId` and `context.reason`.
  - **Breaking:** Vue custom fields receive `modelValue` instead of `value` and emit `update:modelValue` instead of `update:value`, so `v-model` works. Rename the prop and the event in custom field components.
  - **Breaking:** Vue `FormField` component is renamed to `FormhausField`. Import `FormhausField` instead.
  - **Breaking:** Vue `FieldComponentMap` is `Partial<Record<FieldType, Component>>` instead of `Record<FieldType, Component>`.
  - **Breaking:** Vue `FormActions` no longer declares the `action` event. Remove `@action` listeners.
  - **Breaking:** `FormAction.action` is removed from the type and the JSON Schema, so a definition with `action` fails schema validation. Remove `action` from definitions.
  - **Breaking:** React and Vue create a new engine when the `definition` object changes, not only when `definition.id` changes. Pass a stable object, such as a module constant or a memoized value, to keep answers across renders.
- 7fcb7a3: - A field that becomes hidden loses its validation error even when it has no value.
  - A skip that changes the active path removes the errors of fields that leave it.
  - **Breaking:** `engine.skip()` returns `false` on a step without a `skip` action instead of skipping it. Add `skip: { label }` to the step, or call `next()`.

## 0.10.1

### Patch Changes

- 8630259: - A paused form loaded from `@formhaus/core/cloud` fails with code `"paused"` and "This form is paused." instead of "Could not send. Try again."
  - Cloud requests time out after 15 seconds for the definition and 30 seconds for a submission. The `CloudError` has `status` `0`, code `"timeout"` and the `"retry"` action.
  - The network failure message is "Could not reach the form server. Check your connection and try again." instead of "You are offline".
  - A response body that is not JSON fails with a `CloudError` with code `"invalid_response"` instead of a `SyntaxError`.
  - `start()` of `createCloudController()` loads the definition again after a load error.
- 8630259: - `validateDefinition()` and `checkDefinition()` from `@formhaus/core/server` return messages for malformed input instead of throwing. This covers `null`, `fields` or `steps` that are not arrays, a step without `fields`, and `show`, `showAny` or `routes` that are not arrays.
  - The `FormEngine` constructor throws an `Error` that names the malformed part instead of a `TypeError`.
  - `validateDefinition()` reports a missing `submit` action and a condition without a `field` name.
  - `FormDefinition` accepts `$schema`.
  - `validateSubmission()` no longer logs definition warnings with `console.warn`.
- 0414183: - `inputMode` accepts `decimal`, `url` and `search`.
- a15c07f: Fixed fields below a radio or multiselect group jumping when an input gets focus in Safari.
- 26eb04c: - A submit that fails on a field of an earlier step moves the form to that step.
- 4d656df: - On touch screens the stylesheet uses 17px text and 15px helper and error text. Inputs stay at 16px or more, so iOS Safari does not zoom in on focus.
  - The whole checkbox and switch row toggles the control. On touch screens the row is at least 44px tall.

## 0.10.0

### Minor Changes

- 113cbc7: - `submitAsync()` and `skipStepAsync()` pass the ids of skipped steps as a second argument to the submit function.
  - New `@formhaus/core/cloud` entry with `fetchDefinition()`, `createSubmitter()`, `createCloudController()` and `CloudError` for forms hosted on Formhaus Cloud.
- 70690ac: - **Breaking:** `onError` in `FormhausForm` receives a `CloudError` with `status` `0` and `code` `"network"` on a network failure instead of a `TypeError`.
  - `FormhausForm` shows every failed submission in a notice above the form, with "Try again" for 429, 5xx and network failures. The notice takes focus. Entered values stay.
  - `FormhausForm` focuses the first field with a server error when there is no notice. Messages for keys the form does not render are listed in the notice.
  - `FormhausForm` sends the version it rendered. When the form was republished and the values no longer pass, it loads the new version, keeps the answers whose field key and type still fit, marks dropped answers with "Please answer again." and asks to review and submit again.
  - `FormhausForm` now renders the form inside a `div.fh-cloud` wrapper.
  - `CloudError.message` texts changed. `CloudError` has `action` (`"retry"`, `"reload"` or `null`), `retryable` and, for `form_updated`, `version`.
  - `createSubmitter()` takes an optional `version` next to `id` and `apiBase`.
  - New `.fh-form__notice` styles in `@formhaus/core/style.css`.
- 6654e27: - New `checkDefinition(definition)` in `@formhaus/core/server` and on the `Formhaus` IIFE global. It returns `{ errors, warnings }`: errors are definitions `FormEngine` rejects, warnings are the rest of `validateDefinition()`.
- a479c16: - New `@formhaus/core/server` entry with `validateSubmission(definition, values, { skippedSteps })`. It returns the submit values and errors for a submitted payload.
  - `validateSubmission()` drops unknown keys and values of hidden steps, hidden fields and skipped steps. It accepts a skip only for steps with `skip`.
  - `validateSubmission()` checks value types: text fields and `file` take strings, `number` takes numbers or decimal strings, `checkbox` and `switch` take booleans, choices must come from `options`.
  - `validateSubmission()` checks `email`, `date` (`YYYY-MM-DD`) and `datetime` (ISO 8601) formats.
  - `validateSubmission()` accepts only strings, numbers and booleans in custom field types.
  - `validateSubmission()` rejects strings over 10,000 characters or the field's `maxLength` before any rule runs. Custom `validators` are ignored.
  - New `@formhaus/core/server.iife.js` build exposes `validateSubmission` on a `Formhaus` global.
  - Shared submission fixtures ship in `@formhaus/core/fixtures/submissions/*.json`. Each file holds one definition and its cases.
- 2e9e7c1: - Form definitions accept an optional `description` of up to 1000 characters.
  - New `layout` field option for `radio` and `multiselect`: `"stack"` (default) or `"inline"`.
  - **Breaking:** redesigned default stylesheet. Custom CSS that targets field classes or relies on the helper and control order may need updating.
  - Default stylesheet changes: wider spacing between questions, 15px text, 10px radius, violet primary `#5502fb` instead of blue `#2563eb`.
  - Radio and multiselect options are full-width rows with hover, selected and focus states.
  - The primary button spans the full width on screens up to 480px.
  - Dark colors apply with `data-fh-theme="dark"` on the form or an ancestor. Without it the stylesheet stays light.
  - Hover and selected-option colors follow `--fh-color-primary`.
  - New custom properties `--fh-color-border-hover`, `--fh-color-primary-soft` and `--fh-control-height`.
  - Visible focus and checked states in Windows high contrast mode.

### Patch Changes

- 3f5bfee: - Field keys `__proto__`, `constructor`, `prototype` and the other `Object.prototype` property names are rejected by `FormEngine`, `validateDefinition`, `checkDefinition` and the JSON Schema. They bypassed `required`.

## 0.9.0

### Minor Changes

- ae557e6: - **Breaking:** The `FormEngine` constructor throws on duplicate step ids in forms without routes.
  - **Breaking:** `notEmpty` treats an empty array as empty, the same as `required`.
  - `validateField()` returns `null` when a validator returns `''`.
  - **Breaking:** In forms without routes, fields of a skipped step have no value for `matchField`, validators and step hooks, as in forms with routes.
  - `validateDefinition()` reports duplicate step ids in forms without routes.
  - `validateDefinition()` warns when a step condition in a routed form references a field of the same or a later step.
  - `validateDefinition()` says that `FormEngine` rejects a definition with both `fields` and `steps`, instead of saying `fields` is ignored.
  - The constructor error for a definition with both `fields` and `steps` now matches that warning text.
  - The `FormEngine` constructor warns about a `validator` name missing from the `validators` option.

## 0.8.0

### Minor Changes

- 75e49f2: - New JSON Schema for form definitions at `@formhaus/core/schema.json` and `https://formhaus.dev/schema/form-definition.json`.
- 2bd4c47: - New `skip` step option. A skipped step is left out of submit validation and submitted values.
  - New `skipStep()` and `skipStepAsync()` reset the current step to its defaults and move forward without validation.
  - `skipStepAsync(submit)` submits without the step when no step follows it. Without `submit` it returns `false` and changes nothing.
  - New `isStepSkipped()` method.
  - Pressing Next or Submit on a skipped step, or changing one of its fields, includes it again.
  - `StepChangeContext.reason` can be `'skip'`.
  - New `step_skipped` analytics event type.
  - `validateDefinition()` warns about `skip` on a single-step form or a step with `next: false`.

## 0.7.2

No changes. Version aligned with `@formhaus/react` and `@formhaus/vue`.

## 0.7.1

### Patch Changes

- 4371c19: - `required` on checkbox and switch fields rejects `false`, so a required box must be checked.
  - Changing an earlier answer that shows or hides another step no longer moves the user off the current step.
  - A `matchField` error clears once the referenced field makes the values match.
  - Errors on fields that leave the active route path are cleared.
  - New `shouldApplyExternalErrors()` helper for custom renderers.

## 0.7.0

### Minor Changes

- - New `onBeforeStepChange`, `onAfterStepChange`, `onBeforeSubmit` and `onAfterSubmit` options. A before-hook cancels the action by returning `false`.
  - New `prevStepAsync()`, `submitAsync()` and `cancelPendingActions()` methods and the `submitting` state.
  - New `FormLifecycleError` marks an after-hook failure for an action that already completed.
  - New `autoAdvance` field option and `next: false` step option.
  - New step `routes` choose the next step from answers. Exposes the `StepRoute` type.
  - `FormEngine` throws on invalid routes. `validateDefinition()` reports them and warns when a branch falls through into a sibling branch.

## 0.6.0

No changes. Version aligned with `@formhaus/react` and `@formhaus/vue`.

## 0.5.0

### Minor Changes

- ad80814: - New `subscribeField()`, `getFieldSnapshot()`, `subscribeStructure()`, and `getStructureSnapshot()` methods expose granular form updates.

### Patch Changes

- 76b2a0d: - `stepValidating` reads `false` in the notification that delivers async step-validation errors.
- 76b2a0d: - `setErrors()` surfaces errors from hidden steps at form level.
  - `reset()` clears loading state and discards pending step validation results.
  - Definition warnings include missing and circular step visibility dependencies.
- ad80814: - `visibleFields` no longer runs current-step validators.
- ad80814: - `reset()` clears values for fields that the reset values hide, instead of keeping them until the next change.
  - Construction clears initial values for fields that other initial values hide, matching `reset()`.
- ad80814: - Visibility cascades now clear dependency chains longer than 50 fields.
  - Deep visibility dependency graphs no longer overflow the call stack during definition validation.

## 0.4.0 - 2026-05-10

### Minor

- New `'autocomplete'` member of `DefaultFieldType` for type-to-filter dropdowns. The default React and Vue renderers use `<input>` + `<datalist>` (native browser filtering, SSR-safe). Note: native `<datalist>` filters by `value`, not `label`, and does not enforce that the typed value is one of the options. See the field types guide.
- New `'datetime'` member of `DefaultFieldType`. The default React and Vue renderers use `<input type="datetime-local">`, which emits `YYYY-MM-DDTHH:mm` without timezone. For richer pickers or ISO output, plug in your own component via `components`. See the field types guide.
- New optional baseline stylesheet at `@formhaus/core/style.css`. Import it for sensible default styling on the native field components: padding, focus state, error colour, button styles, step progress bar. Theme via CSS custom properties (`--fh-color-primary`, `--fh-radius`, `--fh-gap`, etc.). The `sideEffects` field is now `["**/*.css"]` so bundlers preserve the import.

### Patch

- Fixtures are no longer published to npm. They were demo data for the docs and playground, never reachable from consumer code (`exports` only declared the root entry, so `import x from '@formhaus/core/fixtures/basic-form.json'` failed under strict ESM anyway). The Quick Start guide now shows a literal definition object.
- Source maps now ship alongside the minified bundle. Stack traces in consumer apps point at the original source line in `src/`, not minified one-letter variables.
