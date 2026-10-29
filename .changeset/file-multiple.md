---
"@formhaus/core": minor
"@formhaus/react": minor
"@formhaus/vue": minor
"@formhaus/mcp": minor
---

- Format 1.7: `"multiple": true` on a `file` field keeps a list of files. The value is an array, `required` needs at least one file, and `validation.minLength` and `maxLength` count files. A list holds at most 100 files without `maxLength`.
- `multiple` takes effect only with `"formatVersion": "1.7"` or newer. Below it the field keeps one file, as before.
- `validateSubmission()` checks a file list as an array of reference strings, and reads a single reference as a list of one.
- The built-in React and Vue file fields add picked files to the list and show each file with a Remove button. The picker stops at the list's maximum and shows the `maxItems` message when it drops files.
- `mapControls` passes `multiple` to a `file` control and writes the picked files as an array.
- `FormhausForm` uploads each file of a list and submits the list of upload ids.
- New `isFileList`, `addFiles`, `removeFile` and `fileEntries` in `@formhaus/core/fields`.
- `checkDefinition()` reports `multiple-not-applicable`, and `outdated-format-version` for `multiple` below format 1.7. `suggestFixes()` offers to remove `multiple` where it does not apply.
- `capabilities` in `@formhaus/mcp` describes `multiple`.
