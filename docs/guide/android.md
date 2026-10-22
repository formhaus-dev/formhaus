---
title: "Android and JVM"
description: "Run Formhaus JSON form definitions on Android and the JVM with the Kotlin engine, with the same validation and branching as the web packages."
---

# Android and JVM

`formhaus-kotlin` runs Formhaus JSON form definitions on Android and the JVM. `formhaus-core` is the engine, in pure Kotlin with no JavaScript runtime.

[Source](https://github.com/formhaus-dev/formhaus-kotlin) · [Changelog](https://github.com/formhaus-dev/formhaus-kotlin/blob/main/CHANGELOG.md)

## Install

Releases are served from JitPack. Add the repository in `settings.gradle.kts`:

```kotlin
dependencyResolutionManagement {
    repositories {
        mavenCentral()
        maven("https://jitpack.io")
    }
}
```

Add the dependency:

```kotlin
dependencies {
    implementation("com.github.formhaus-dev:formhaus-kotlin:v0.1.0")
}
```

Requires JDK 17 or later, or Android with `minSdk` 26 or later. The only dependency is `kotlinx-coroutines-core`.

| formhaus-kotlin | @formhaus/core | formatVersion |
|---|---|---|
| 0.1.0 | 1.2.2 | 1.6 |

## Run a form

Parse a definition, create a `FormEngine` and set values:

```kotlin
import dev.formhaus.core.engine.FormEngine
import dev.formhaus.core.json.JsonValue

val definition = JsonValue.parse(
    """
    {
      "id": "signup",
      "formatVersion": "1.6",
      "title": "Sign up",
      "submit": { "label": "Sign up" },
      "steps": [
        { "id": "account", "title": "Account", "fields": [
          { "key": "email", "type": "email", "label": "Email", "validation": { "required": true } }
        ] },
        { "id": "profile", "title": "Profile", "fields": [
          { "key": "name", "type": "text", "label": "Name" }
        ] }
      ]
    }
    """,
)

val engine = FormEngine(definition)
engine.setValue("email", JsonValue.String("ada@example.com"))
```

`next`, `back`, `skip` and `submit` are `suspend` functions, because hooks and the submit handler can wait on the network. `next` returns `false` when validation fails, and the errors are in `engine.errors`:

```kotlin
import dev.formhaus.core.engine.SubmitResult
import dev.formhaus.core.json.toJsonString

suspend fun fill() {
    if (engine.next()) {
        engine.setValue("name", JsonValue.String("Ada"))
        engine.submit { values, _ ->
            send(values.toJsonString())
            SubmitResult.Ok
        }
    }
}
```

The submit handler receives the values of the active path and the ids of skipped steps. It returns `SubmitResult.Ok`, or `SubmitResult.Rejected(errors, formErrors)` to show server errors on the fields. `SubmitResult.of(json)` reads the `{ ok, errors, formErrors }` object that a Formhaus endpoint returns.

Observe the engine with `engine.subscribe { ... }`, which returns a function that removes the listener. After each change, read `engine.currentStep`, `engine.visibleFields`, `engine.errors`, `engine.topLevelErrors`, `engine.progress` and `engine.canGoNext`.

## Same rules as the web

The Kotlin engine passes the conformance suite of `@formhaus/core`. Validation, conditions, routes, answer recall and the submit payload match the TypeScript packages.

## Validate on the server

`validateSubmission` checks the values against the same definition, with the visibility, steps and routes of the client:

```kotlin
import dev.formhaus.core.server.SubmissionOptions
import dev.formhaus.core.server.validateSubmission

val result = validateSubmission(
    definition,
    JsonValue.parse(requestBody),
    SubmissionOptions(skippedSteps = listOf("profile")),
)
if (result.errors.isEmpty()) {
    save(result.values)
} else {
    reject(result.errors)
}
```

The body is the values object. `result.values` holds the values of the active path and `result.errors` maps field keys to messages. `SubmissionOptions` also takes `validators`, `messages` and `hiddenValues`.

`checkDefinition` lists the issues of a definition:

```kotlin
import dev.formhaus.core.definitionvalidation.checkDefinition

val problems = checkDefinition(definition).filter { it.isError }
```

## Random option order

For [random option order](/guide/research), pass `Research()` and an optional seed:

```kotlin
import dev.formhaus.core.engine.FormEngineOptions
import dev.formhaus.research.Research

val engine = FormEngine(
    definition,
    options = FormEngineOptions(research = Research(), seed = "respondent-42"),
)
```

The same seed gives the same order.

## Translations

`localize` applies an overlay of translated texts and sets the language. `missingKeys` lists the built-in message and label keys that a catalog lacks, for a unit test of your translations:

```kotlin
import dev.formhaus.core.i18n.localize
import dev.formhaus.core.i18n.missingKeys
import dev.formhaus.core.validation.MessageSource

val overlay = JsonValue.parse("""{ "fields": { "email": { "label": "E-Mail" } }, "submit": { "label": "Anmelden" } }""")
val localized = localize(definition, overlay, "de")

val engine = FormEngine(
    localized.definition,
    options = FormEngineOptions(messages = MessageSource.Catalog(localized.messages)),
)
val missing = missingKeys(messages = MessageSource.Catalog(localized.messages))
```

## Threading

`FormEngine` is single-threaded. Create it and call it from one thread, such as the main thread, and do not share it. With `debugChecks = true` in `FormEngineOptions`, a call from another thread throws `IllegalStateException`. `validateSubmission`, `checkDefinition`, `localize` and the JSON parser can run on any thread.

## Differences

The Kotlin port has no draft saving and no Formhaus Cloud client. See the [README](https://github.com/formhaus-dev/formhaus-kotlin#readme) for the full API.
