---
title: "iOS and macOS"
description: "Render Formhaus JSON form definitions on iOS and macOS with SwiftUI, with the same validation and branching as the web packages."
---

# iOS and macOS

`formhaus-swift` renders Formhaus JSON form definitions on iOS and macOS. `FormhausCore` is the engine and `FormhausUI` is the SwiftUI renderer.

[Source](https://github.com/formhaus-dev/formhaus-swift) · [Demo app](https://github.com/formhaus-dev/formhaus-swift/tree/main/Examples/FormhausDemo) · [Changelog](https://github.com/formhaus-dev/formhaus-swift/blob/main/CHANGELOG.md)

## Install

In Xcode, add the package URL under Package Dependencies and add `FormhausCore` and `FormhausUI` to your app target. In a `Package.swift` manifest, add this entry to `dependencies`:

```swift
.package(url: "https://github.com/formhaus-dev/formhaus-swift.git", from: "0.1.3")
```

Requires Swift 6.2 and iOS 17 or macOS 14. The package has no JavaScript runtime.

| formhaus-swift | @formhaus/core | formatVersion |
|---|---|---|
| 0.1.3 | 1.0.0 | 1.5 |
| 0.1.0 to 0.1.2 | 0.22.0 | 1.5 |

## Render a form

Load the definition from JSON with `FormDefinition(json:)`:

```swift
let url = Bundle.main.url(forResource: "signup", withExtension: "json")!
let definition = try FormDefinition(json: JSONValue(parsing: Data(contentsOf: url)))
```

Pass it to `FormhausForm` with a submit handler:

```swift
import FormhausCore
import FormhausUI
import SwiftUI

struct SignupView: View {
    let definition: FormDefinition
    let endpoint: URL

    var body: some View {
        FormhausForm(definition: definition) { values, _ in
            var request = URLRequest(url: endpoint)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = values.jsonData()
            let (data, _) = try await URLSession.shared.data(for: request)
            return SubmitResult(json: try JSONValue(parsing: data))
        }
    }
}
```

The handler returns a `SubmitResult`. `SubmitResult(json:)` reads the response body. A body with `"ok": false` is a rejection, and its `errors` object maps field keys to messages:

```json
{ "ok": false, "errors": { "email": "This email is already registered" } }
```

The form shows these messages on the fields. Any other body counts as success.

## Choose a look

| Formhaus | iOS system | Your own |
|:---:|:---:|:---:|
| ![The Formhaus set](./media/swift/set-formhaus.png) | ![The native iOS set](./media/swift/set-system.png) | ![A custom brand set](./media/swift/set-kiln.png) |

- The Formhaus set is `.standard`, the default. It matches the web renderers and uses the Formhaus design tokens.
- `.formhausComponents(.system)` renders a native grouped form, like a Settings screen.
- Register your own SwiftUI views per field type. Types you leave out keep the built-in views. See [SwiftUI components](/guide/integrations/swiftui).

```swift
FormhausForm(definition: definition) { values, _ in .ok }
    .formhausComponents(.standard.field("text") { MyTextField(context: $0) })
```

## Same rules as the web

The Swift engine passes the conformance suite of `@formhaus/core`. Validation, conditions, routes, answer recall and the submit payload match the TypeScript packages.

Validate submissions on a Swift server with the same definition:

```swift
let result = validateSubmission(definition, try JSONValue(parsing: body))
```

## Accessibility

The built-in sets label every control for VoiceOver. After a failed submit, VoiceOver focus moves to the error summary or the invalid field. Text sizes follow Dynamic Type. Reduce Motion turns animations off. Tap targets are at least 44 pt. Increase Contrast switches to the high-contrast palette.

## Differences

The Swift package has no draft saving and no Formhaus Cloud client. See the [README](https://github.com/formhaus-dev/formhaus-swift#differences-from-typescript) for the full list.
