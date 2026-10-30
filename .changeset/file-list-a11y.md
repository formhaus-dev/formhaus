---
"@formhaus/core": patch
"@formhaus/react": patch
"@formhaus/vue": patch
---

- The multi-file list is a named list (`role="list"`, labelled by the field label).
- Repeated file status messages, such as removing two files with the same name, are announced again.
- The file limit notice is linked to the picker through `aria-describedby`.
- The file limit notice stays visible while the list is full.
- Under forced colors the file input hides "No file chosen" and a full picker looks disabled.
- A disabled file picker greys out its button too.
