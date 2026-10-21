---
title: "SwiftUI components"
description: "Render Formhaus JSON forms with your own SwiftUI views: register a view per field type, read FieldContext, and replace the form actions."
---

# SwiftUI components

Register your own SwiftUI views per field type with `.formhausComponents`. Types you leave out keep the built-in views of the set you start from.

[iOS and macOS guide](/guide/ios) · [Kiln example set](https://github.com/formhaus-dev/formhaus-swift/tree/main/Examples/FormhausDemo/FormhausDemo/Brand)

## Component map

Each `.field` call maps one field type to a view. Start from `.standard` (the Formhaus set), `.system` (native iOS) or `.headless` (no built-in views):

```swift
import FormhausCore
import FormhausUI
import SwiftUI

extension FormComponents {
    static let acme = FormComponents.standard
        .field("text") { AcmeTextField(context: $0) }
        .field("email") { AcmeTextField(context: $0) }
        .field("select") { AcmeSelect(context: $0) }
        .field("checkbox") { AcmeCheckbox(context: $0) }
}

struct SignupView: View {
    let definition: FormDefinition

    var body: some View {
        FormhausForm(definition: definition) { values, _ in .ok }
            .formhausComponents(.acme)
    }
}
```

The submit handler here returns `.ok` without sending anything. Use your own handler, as in [Render a form](/guide/ios#render-a-form). Switching the components of a running form keeps its values, step and errors.

## Fields

Each view registered with `.field` receives a `FieldContext`:

| Member | What it is |
|---|---|
| `label`, `placeholder`, `helperText` | Translated texts of the field |
| `value`, `text` | Current value as `JSONValue?`, and as text |
| `textBinding`, `boolBinding` | Bindings for `TextField` and `Toggle` |
| `setValue(_:)`, `commit(_:)` | Write a value; `commit` also moves to the next step when the field sets `autoAdvance` |
| `options` | Options of choice fields, each with `value`, `label` and `image` |
| `error`, `isInvalid` | Error message to show under the field, and whether there is one |
| `isRequired`, `isLocked` | Required flag, and whether the form is busy or the field is disabled |
| `accessibilityName` | Label with the required marker for VoiceOver |
| `field` | The full field definition |

A text field:

```swift
struct AcmeTextField: View {
    @FocusState private var focused: Bool
    let context: FieldContext

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(verbatim: context.label).font(.subheadline.weight(.semibold))
            TextField(context.placeholder ?? "", text: context.textBinding)
                .textFieldStyle(.roundedBorder)
                .disabled(context.isLocked)
                .formhausFocus(context, $focused)
                .accessibilityLabel(context.accessibilityName)
            if let error = context.error {
                Text(verbatim: error).font(.footnote).foregroundStyle(.red)
            }
        }
        .formhausScrollAnchor(context)
    }
}
```

`.formhausFocus` moves focus to the first invalid field after a failed submit. It keeps the keyboard up while the form is busy. `.formhausScrollAnchor` lets the form scroll to the field from the error summary.

A select with the native `Picker`:

```swift
struct AcmeSelect: View {
    let context: FieldContext

    var body: some View {
        Picker(context.label, selection: selection) {
            Text(verbatim: context.placeholder ?? "Choose").tag("")
            ForEach(context.options, id: \.self) { option in
                Text(verbatim: option.label ?? "").tag(option.value ?? "")
            }
        }
        .pickerStyle(.menu)
        .disabled(context.isLocked)
        .formhausScrollAnchor(context)
    }

    private var selection: Binding<String> {
        Binding(
            get: { context.value?.stringValue ?? "" },
            set: { context.setValue($0.isEmpty ? nil : .string($0)) }
        )
    }
}
```

A checkbox with `Toggle`:

```swift
struct AcmeCheckbox: View {
    let context: FieldContext

    var body: some View {
        Toggle(context.label, isOn: context.boolBinding)
            .disabled(context.isLocked)
            .formhausScrollAnchor(context)
    }
}
```

## Actions and containers

`.actions` replaces the Continue, Back and Submit row. `ActionsContext` holds the labels and flags of the current step:

```swift
struct AcmeActions: View {
    let context: ActionsContext

    var body: some View {
        HStack {
            if context.state.showBack {
                Button(context.state.backLabel) { context.back() }
            }
            Spacer()
            Button(context.state.primaryLabel) { context.performPrimaryAction() }
                .buttonStyle(.borderedProminent)
                .disabled(context.state.primaryDisabled || context.busy)
        }
    }
}

FormhausForm(definition: definition) { values, _ in .ok }
    .formhausComponents(.acme.actions { AcmeActions(context: $0) })
```

`.progress`, `.section`, `.group`, `.groupItem` and `.confirmDialog` replace the other containers the same way.

## Theme only

To keep the built-in views and change colors, fonts and radii, set a `FormhausTheme` with `.formhausTheme` instead. Custom views read the resolved tokens from `@Environment(\.formhausTokens)`. See [Theming](https://github.com/formhaus-dev/formhaus-swift#theming) in the README.
