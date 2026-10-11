---
"@formhaus/core": minor
---

- Form definitions accept an optional `description` of up to 1000 characters.
- New `layout` field option for `radio` and `multiselect`: `"stack"` (default) or `"inline"`.
- **Breaking:** redesigned default stylesheet. Custom CSS that targets field classes or relies on the helper and control order may need updating.
- Default stylesheet changes: wider spacing between questions, 15px text, 10px radius, violet primary `#5502fb` instead of blue `#2563eb`.
- Radio and multiselect options are full-width rows with hover, selected and focus states.
- The primary button spans the full width on screens up to 480px.
- Dark colors apply with `data-fh-theme="dark"` on the form or an ancestor. Without it the stylesheet stays light.
- Hover and selected-option colors follow `--fh-color-primary`.
- New custom properties `--fh-color-border-hover`, `--fh-color-primary-soft` and `--fh-control-height`.
- Visible focus and checked states in Windows high contrast mode.
