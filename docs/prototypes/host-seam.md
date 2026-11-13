# Does the host seam hold for Switch and Dialog

Prototype report for [issue #14](https://github.com/floklein/rn-ui/issues/14), against point 6 of the resolution on [Where the host seam sits in core](https://github.com/floklein/rn-ui/issues/13). Written 2026-11-14.

- **Branch:** `prototype/host-seam`, from `36fb6964`. Throwaway: never merged.
- **Code:** `packages/react-native` (the adapter), the files marked `PROTOTYPE (issue #14)` under `packages/core/src`, `apps/native-playground`, and `scripts/prototype-host-seam`.
- **Devices:** iPhone 17 Pro simulator, iOS 27.3, Expo Go 58.0.7. Pixel 10 Pro Fold emulator, Android 36, Expo Go 58.0.5. Expo SDK 58, React Native 0.88.1, no Metro config.
- **Words:** "observed" means I saw it on the device, in the playground's on-screen log, the accessibility tree or a screenshot. "Checked" means verified another way, which the line names. "Not verified" means neither.

## Verdict

The seam held for what point 6 lists, inside its bound: Switch and Dialog ran on both devices through one shared primitive definition each, the unit tests and the React specs for what I touched stayed green (the full `pnpm test:pr` exited 1 on a loaded machine, with failures that occur the same on the base commit or pass when run alone), the twins resolved from workspace source and from a packed build, and the diff inside files upstream owns is 30 added and 3 removed lines in 6 files, none in `popups/popup.ts` or `forms/form.ts`.

It held by doing less than the seam's wording promises. For a popup, twins at the owning modules are not reachable: every call `popup.ts` makes to them sits behind `bind`, which the native host never calls. Dialog's native behavior is therefore a parallel implementation of what `popup.bind` orchestrates, not shared code calling twins. And three things parity needs can't be had without a change to `popup.ts`: presence on close, the focus mode of a close, and the opener. The prototype stopped at that wall and records the smallest change for each in [the leak list](#the-leak-list).

## What was built

| Piece                                                                                                                           | Where                                                                  | Lines   |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------- |
| The native host interface: `NativeHost` (`focus`, `listen`), `NativeInput`, `NativeBehavior`, `setNativeHost`                   | `packages/core/src/foundation/kernel/native-host.ts`                   | 78      |
| Twin: focusing a part                                                                                                           | `foundation/focus/focus-part.ts` and `focus-part.native.ts` (both new) | 19 + 17 |
| Twin: the layer stack                                                                                                           | `foundation/platform/layers.native.ts`, beside upstream's `layers.ts`  | 139     |
| Native behavior of a popup                                                                                                      | `foundation/popups/popup-native.ts`                                    | 126     |
| Native behavior of Dialog                                                                                                       | `components/dialog/dialog-native.ts`                                   | 16      |
| What the adapter may import                                                                                                     | `packages/core/src/native.ts`, as `@ui-sdk/core/native`                | 11      |
| The adapter: `usePrimitive`, `usePart`, `createParts`, the accessibility translation, `renderElement`, the host, Switch, Dialog | `packages/react-native/src`                                            | 1,037   |
| Playground screens                                                                                                              | `apps/native-playground`                                               |         |
| Checks and the pack step                                                                                                        | `scripts/prototype-host-seam`                                          |         |

**Switch needed no native behavior file.** Its press comes through the adapter's generic `press` delivery, its controller's `focus()` through the `focus-part` twin, and form participation has no native meaning. The `input` slot is simply not rendered.

**Dialog needed all of it:** the layer, dismissal input, the flags its parts set in `bind`, focus in and back.

The host interface stayed two functions wide:

```ts
type NativeHost = {
  focus: (part: Part) => void
  listen: (input: {
    back: () => boolean
    escape: () => boolean
    outsidePress: () => boolean
  }) => () => void
}
```

The adapter keeps a `WeakMap` from core's `Part` to the mounted view, so core names a view by the part it already has. Core never imports `react-native`.

## 1. Switch and Dialog on both devices

The full on-device logs are in [host-seam-evidence](host-seam-evidence): [iOS](host-seam-evidence/ios-device-log.txt), [Android](host-seam-evidence/android-device-log.txt). Every line below marked observed is in them. `host.focus`, `host.input` and `host.listen` lines are the adapter's trace of what core's native code asked the host.

### Switch

| Behavior                                                                             | iOS                                   | Android                               | Evidence                                                                                                           |
| ------------------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| A press toggles it, with the switch role and checked state in the accessibility tree | observed                              | observed                              | `[switch] "uncontrolled" [unchecked]` became `[checked]`                                                           |
| Reason and source of a press                                                         | observed                              | observed                              | `onCheckedChange checked=true reason=press source=touch event=undefined`                                           |
| Controller `toggle()`, `setChecked(true)`, `getChecked()`                            | observed                              | observed                              | `reason=imperative source=programmatic`, returns `true`, `true`, `true`                                            |
| Controller `focus()`                                                                 | request observed, effect not verified | request observed, effect not verified | `host.focus slot=root key="" viewMounted=true`. No screen reader ran, so whether its cursor moved is unknown       |
| Controlled change                                                                    | observed                              | observed                              | the callback fired, the parent's state became `true`, and only then did the switch show checked                    |
| Cancelled change                                                                     | observed                              | observed                              | `details.canceled=true`, the switch stayed unchecked                                                               |
| Disabled and read-only                                                               | observed                              | observed                              | a press fired no callback and changed nothing                                                                      |
| Teardown                                                                             | observed                              | observed                              | after unmount, `controller.getChecked() -> undefined`, `toggle() -> undefined`, and `focus()` made no host request |

### Dialog

| Behavior                                              | iOS                                   | Android                                               | Evidence                                                                                                                                                                             |
| ----------------------------------------------------- | ------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A trigger press opens it in a `Modal`                 | observed                              | observed                                              | `onOpenChange open=true reason=trigger-press source=touch`, `modal=true` shown in the content                                                                                        |
| Focus request on open                                 | request observed, effect not verified | request observed, effect not verified                 | `host.focus slot=content viewMounted=true`, once the content's view mounted                                                                                                          |
| Focus request on close                                | request observed, effect not verified | request observed, effect not verified                 | `host.focus slot=trigger viewMounted=true` after every close                                                                                                                         |
| The rest of the screen hidden from accessibility      | not verified                          | observed in the accessibility tree, not with TalkBack | Android: while open, the tree held only the dialog's nodes; "Text behind the dialog" and the tabs were gone. iOS: the XCTest tree lists every window, so it shows nothing either way |
| Close part                                            | observed                              | observed                                              | `reason=close-press source=touch returnValue=cancel`                                                                                                                                 |
| Outside press                                         | observed                              | observed                                              | `reason=outside-press source=touch`, and `host.input outsidePress taken=true`                                                                                                        |
| Android back                                          | n/a                                   | observed                                              | `reason=back source=touch`, `host.input back taken=true`, through `Modal`'s `onRequestClose`                                                                                         |
| A refused dismissal is still taken                    | observed (outside press)              | observed (back and outside press)                     | with `dismissible={false}`: `onDismissAttempt reason=back`, `taken=true`, the dialog stayed open and the app didn't navigate                                                         |
| The iOS escape gesture                                | not verified                          | n/a                                                   | wired through `onAccessibilityEscape`, but a simulator has no VoiceOver to make the gesture                                                                                          |
| Cancelled open and cancelled close                    | observed                              | observed                                              | `details.canceled=true`; it stayed closed, then stayed open                                                                                                                          |
| Close with an async action                            | observed                              | observed                                              | pending for 800 ms ("Deleting…" seen on Android), then `reason=action source=touch returnValue=confirm`                                                                              |
| Controller `open()`, `close()`, `focus()`, `isOpen()` | observed                              | observed                                              | `reason=imperative source=programmatic`; `open()` resolved with the close's reason and source; `focus()` made `host.focus slot=trigger`                                              |
| Controlled `open`                                     | observed                              | observed                                              | the parent's state drove it both ways                                                                                                                                                |
| Teardown while open                                   | observed                              | observed                                              | `host.listen listening=false`, `open() resolved reason=unmount source=programmatic`, `controller.isOpen() -> undefined`, the `Modal` gone                                            |

Two things to read with care:

- **Focus is a request.** `AccessibilityInfo.sendAccessibilityEvent(view, "focus")` was called with a mounted view each time. I could not run a screen reader on either device. VoiceOver doesn't exist on a simulator. TalkBack is installed on the emulator and I enabled it, but `dumpsys accessibility` showed it enabled and not bound, with touch exploration off, while the device tool was connected, so nothing was learned and I turned it off again.
- **Sources are named on the native side.** A press reports `touch`. The adapter reports `virtual` instead when `AccessibilityInfo.isScreenReaderEnabled()` is true, because `onPress` doesn't say who pressed. That branch never ran.

Screenshots: see the end of this report.

## 2. The web side

Run from the repo, through `scripts/test-slot.sh`, each with its own port.

| Command                                                                                                                                                                                                                                                                                                                                                                     | Exit code | Result                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `cd packages/core && pnpm typecheck`                                                                                                                                                                                                                                                                                                                                        | 0         |                                                                                          |
| `cd packages/core && ../../scripts/test-slot.sh npx vitest run`                                                                                                                                                                                                                                                                                                             | 0         | 216 files, 4,317 passed, 15 skipped                                                      |
| `cd packages/react && ../../scripts/test-slot.sh npx vitest run`                                                                                                                                                                                                                                                                                                            | 0         | 62 files, 1,357 passed, 15 skipped                                                       |
| `cd tests && PLAYGROUND_PORT=5317 ../scripts/test-slot.sh npx playwright test specs/switch.spec.ts specs/checkbox specs/dialog specs/popover.spec.ts --project react --reporter=line`                                                                                                                                                                                       | 0         | 227 passed, 5 skipped                                                                    |
| `PLAYGROUND_PORT=5317 pnpm test:pr --base 36fb6964`                                                                                                                                                                                                                                                                                                                         | 1         | 8,825 tests in 4 commands: 8,069 passed, 716 skipped, 40 failed. See below               |
| The 40 failures again, alone: `npx playwright test specs/csp.spec.ts:83 specs/dialog.enhancements.spec.ts:158 specs/dialog.patterns.spec.ts:68 specs/dialog.patterns.spec.ts:240 specs/dialog.spec.ts:601 specs/dialog.spec.ts:162 specs/presentation.spec.ts:569 specs/menu.enhancements.spec.ts:81 specs/popover.enhancements.spec.ts:111` in the 11 projects that failed | 1         | 94 passed, 3 skipped, 1 failed                                                           |
| `pnpm format`                                                                                                                                                                                                                                                                                                                                                               | 0         |                                                                                          |
| `pnpm lint`                                                                                                                                                                                                                                                                                                                                                                 | 1         | 24 findings, all from the new public names. See [the leak list](#the-leak-list), item 15 |

**`pnpm test:pr` did not exit 0, and I can't report the full plan green.** What I can report is that no failure traces to the diff:

- The plan ran the whole React project and the touched specs in every other project, because shared code changed. 37 of the 40 failures are tests that read the page's inertness or scroll lock once, without polling, right after a modal popup shows: `csp.spec.ts:83`, `dialog.spec.ts:601`, `dialog.enhancements.spec.ts:158`, `dialog.patterns.spec.ts:68` and `:240`, `presentation.spec.ts:569`, `menu.enhancements.spec.ts:81` and `popover.enhancements.spec.ts:111`. Core freezes the page a paint after the popup opens, so the read races the paint. The other 3 are one Tab test, `dialog.spec.ts:162`, in three projects, which timed out waiting for focus inside that same frozen page. The diff touches neither path.
- The machine was busy throughout: load averages between 50 and 400, from other sessions' simulators and, during the first command, my own build, pack and bundle steps. `tests/playwright.config.ts` retries twice on CI and not locally.
- Run again alone, 39 of the 40 passed.
- The last, `[vue-ssr] specs/csp.spec.ts:83`, I ran 10 times per variant with one worker, alternating between a clean worktree of the base commit `36fb6964` and this branch: base failed 17 and 19 of 20, the branch 18 and 19 of 20. It fails the same without the prototype.
- The Dialog files among them (`dialog.spec.ts`, `dialog.enhancements.spec.ts`, `dialog.patterns.spec.ts`) passed in the React project in the targeted run above.

The first run of the Playwright command exited 1 before any test ran: this machine had no Chromium for the installed Playwright (`chromium_headless_shell-1243`). I ran `npx playwright install chromium` and ran it again; the row above is the second run.

## 3. Twins resolve

**From workspace source.** `npx expo export --platform ios --platform android --source-maps` in `apps/native-playground`, exit 0. Both source maps list `core/src/foundation/platform/layers.native.ts` and `core/src/foundation/focus/focus-part.native.ts`, and neither lists `layers.ts` or `focus-part.ts`. The same bundles ran on both devices, where `controller.focus()` reached the host, which only the native twin does.

**From the packed package, in an app outside the workspace.** `scripts/prototype-host-seam/pack-native.mjs` builds the second output and packs both packages in a staging folder, leaving the repo untouched:

- `dist/native` is a copy of `dist` with each `x.native.js` in the place of `x.js`: the twins are resolved at build time, and no import is rewritten.
- Every published entry gains a `react-native` condition: `{ "types", "react-native": "./dist/native/…", "default": "./dist/…" }`.
- `#dev` and `#name-check` gain the same condition around their `development` and `default` pair, so a native bundle takes them from the native tree too.

A throwaway Expo 58 app in a scratch folder installed the two tarballs with `npm install` and exported for both platforms, exit 0. Its source maps hold 128 core modules, all from `@ui-sdk/core/dist/native/`, none from the DOM tree, among them `dist/native/foundation/platform/layers.js` and `dist/native/foundation/focus/focus-part.js`, which hold the twins' code. That app was bundled to Hermes bytecode. It was not run on a device.

`tsc` in that app fails with TS7016 on `@ui-sdk/react-native/*`: the pack step emits no declarations for the adapter. Types from the packed build are not proven.

**Each pair exports the same names.** `node scripts/prototype-host-seam/check-twins.mjs`, exit 0:

```
foundation/focus/focus-part.native.ts = foundation/focus/focus-part.ts: 1 exports (focusPart)
foundation/platform/layers.native.ts = foundation/platform/layers.ts: 13 exports (Layer,activeLayers,bindPersistentLayer,findLayer,inPersistentLayer,lastClosed,lastEscape,layerContains,layerCount,markClosed,openedSince,persistentLayers,pushLayer)
```

It compares names only. The twin's `Layer` type differs from the one it mirrors and nothing checks that.

## 4. The diff inside files upstream owns

`git diff --stat --diff-filter=M 36fb6964 -- . ':!apps/native-playground'` (`apps/native-playground` is the fork's own):

```
 packages/core/package.json                         | 10 +++++
 packages/core/src/foundation/focus/index.ts        |  1 +
 .../core/src/foundation/forms/toggle-control.ts    |  6 ++-
 packages/core/src/foundation/kernel/index.ts       |  6 +++
 .../core/src/foundation/popups/create-popup.ts     |  9 ++++-
 packages/core/src/foundation/popups/index.ts       |  1 +
 pnpm-lock.yaml                                     | 45 ++++++++++++++++------
 7 files changed, 63 insertions(+), 15 deletions(-)
```

Without the lockfile: 6 files, 30 insertions, 3 deletions. Every edit, by kind:

| File                                 | Kind                | Edit                                                                                                                                      | Why                                                                         |
| ------------------------------------ | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `foundation/forms/toggle-control.ts` | import line         | `import { focusPart } from "../focus/focus-part"`                                                                                         | the reroute below                                                           |
| `foundation/forms/toggle-control.ts` | type                | `"store" \| "element"` became `"store" \| "element" \| "parts"`, and `parts` joins the destructuring                                      | the twin names a part, not an element                                       |
| `foundation/forms/toggle-control.ts` | reroute             | `focus: () => element("root")?.focus()` became `focus: () => focusPart(() => element("root"), parts, "root")`                             | a controller's `focus()` did nothing on native                              |
| `foundation/popups/create-popup.ts`  | import line         | the same import                                                                                                                           | the reroute below                                                           |
| `foundation/popups/create-popup.ts`  | reroute             | `focus: () => triggerElement()?.focus()` became `focus: () => focusPart(triggerElement, context.parts, triggerSlot, store.get().trigger)` | the same, for every popup's controller                                      |
| `foundation/focus/index.ts`          | other: export line  | `focusPart`                                                                                                                               | `import-layers` lint: another folder imports it                             |
| `foundation/kernel/index.ts`         | other: export lines | `NativeBehavior`, `NativeHost`, `nativeHost`, `partIn`                                                                                    | the same lint                                                               |
| `foundation/popups/index.ts`         | other: export line  | `popupNative`                                                                                                                             | the same lint                                                               |
| `packages/core/package.json`         | other: manifest     | `./native` and `./native/dialog` in `exports`, and their `publishConfig` pairs                                                            | the adapter needs to import the host interface and Dialog's native behavior |
| `pnpm-lock.yaml`                     | other: generated    | the new package and the playground's dependency on it                                                                                     |                                                                             |

Two reroutes, two import lines, one type. On the DOM host both reroutes run the same expression as before, so web behavior is unchanged by construction, and the specs agree.

**Against an upstream merge.** The two reroutes sit on one line each of upstream's files, so they conflict only when upstream edits those lines. The index and manifest lines are additions in lists upstream appends to, which merge cleanly unless both add at the same spot. The cost that grows is not in this diff: `layers.native.ts` duplicates the stack of `layers.ts`, and `popup-native.ts` restates part of `popup.ts`'s `attach`. Upstream changes to either won't conflict, and won't reach the native host either. Only the name check notices a new export; nothing notices a changed rule.

## The no-document probe

`node scripts/prototype-host-seam/probe-no-document.mjs`, exit 0, in Node with no `document`. It takes every entry of `@ui-sdk/core` (69, without `./internal/*`, `./web.css` and `./testing`), finds the 60 primitives they export, and for each: creates it, keeps it, reads its api, makes a part per slot with no props, reads `attrs`, state and presence, delivers `press`, calls `focus()`, destroys it. Output: [DOM modules](host-seam-evidence/probe-no-document.txt), [native twins with `window` defined](host-seam-evidence/probe-no-document-native.txt). The three variants I ran gave the same list.

**Nothing throws on create, keep, api, presence or destroy, and no `focus()` throws.** Six throws are the host's, all in a `press` handler, which is the one handler the native adapter does run:

| Primitive       | Slot    | Where                                               | Error in Node                     |
| --------------- | ------- | --------------------------------------------------- | --------------------------------- |
| `field`         | `label` | `components/field/field.ts:520`                     | `HTMLLabelElement is not defined` |
| `combobox`      | `label` | `components/combobox/combobox-parts.ts:204`         | `HTMLLabelElement is not defined` |
| `autocomplete`  | `label` | `components/autocomplete/autocomplete-parts.ts:117` | `HTMLLabelElement is not defined` |
| `inputGroup`    | `group` | `foundation/forms/text-field.ts:206`                | `Element is not defined`          |
| `passwordInput` | `root`  | `foundation/forms/text-field.ts:206`                | `Element is not defined`          |
| `tree`          | `item`  | `components/tree/tree-api.ts:797`                   | `HTMLElement is not defined`      |

They are `instanceof` checks against DOM classes. React Native 0.88 defines `HTMLElement`, so the last may not throw on Hermes; I didn't run it there.

The other 17 throws are the probe's own: a slot that needs a prop, like a calendar day's `value`, got none (`Cannot read properties of undefined`). They say nothing about the host.

The probe can't see the larger class, which is paths that do nothing. No `focus()` threw because, apart from the two rerouted, each quietly focuses nothing. See item 10.

## The leak list

Every place the seam as decided didn't fit. "Smallest change" is what it would take; none of these changes were made.

**Popups: where the wall is**

1. **Twins at the owning modules are unreachable for a popup.** `pushLayer`, `inertOutside`, `lockScroll`, `animateIn`, `animateOut`, `position` and the close watcher are all called from `attach(el, config)` in `popup.ts`, which runs only from `popup.bind(el)`. The native host never calls `bind`, so a twin of `modal.ts`, `presence.ts` or `position.ts` would be dead code. Shared code reached exactly one twin for Dialog, `focus-part`, through the reroute. The `layers` twin is reached only because `popup-native.ts`, a native-only file, imports it. So point 4's "each capability gets a twin" doesn't carry Dialog; point 3's native behavior file does, by restating the order of `attach`: push a layer, run the `onShow` rule, ask for focus, and on close pop it and ask for focus back.
2. **Presence needs a change to `popup.ts`.** With nothing shown, the close branch writes `mounted: false` and calls `onOpenChangeComplete(false)` in the same pass (`popup.ts:663-668`), and `mountedAs` is `open || (!!shown?.el && isBrowser)`. On native the content unmounts the moment it closes, so core's state can't hold an exit animation, and `onOpenChangeComplete` fires at once in both directions (observed: it logs before the content's view mounts). Smallest change: that branch hands the unmount and the completion to a presence function with a twin, about three lines in `popup.ts`'s subscriber. That is a logic change to `popup.ts`, outside the bound. Point 6 doesn't list animation, so the prototype stopped here.
3. **Where focus goes on a close is closed over in `popup.ts`.** `control.hide({ focus: false })`, `"later"` and `"unless-moved"` set `returnMode` through `popup.returnFocus(mode)`, and nothing reads it back. The native close always asks for focus on the trigger, unless `finalFocus="none"`. Smallest change: one accessor on the object `createPopupLayer` returns. An addition to `popup.ts`, not a logic change, but in that file.
4. **The opener comes from the event.** `openerOf(event)` returns `"imperative"` without one (`popup-features.ts:91`), so a native trigger press opens as code would. On the web that picks another initial focus plan and reorders the return chain. It is harmless on native only because native runs neither. `withSource("touch", …)` names the source for the change's details, but `openerOf` doesn't consult it. Smallest change: `press` takes the opener from its caller, an api edit in `popup-features.ts`, or `details.ts` exposes the current cause, which point 7 rules out.
5. **Core's focus resolvers take and return elements.** `press.initialFocus(content: HTMLElement, …)`, Dialog's `preferredFocus` rule (`querySelector("[autofocus]")`, `isTabbable`) and `finalFocus` selectors can't run. The decision on focus says native asks for focus on "the element core's own resolver picks"; it can't. `popup-native.ts` decides again in its own words: `"none"` asks for nothing, an alert dialog starts on its first close part, anything else on the content. A native copy of a decision, kept in step by hand.
6. **Slots that write state in `bind` need a native mount hook, which the seam didn't name.** `titled`, `described` and the first trigger's key are set by the title's, the description's and the trigger's `bind`. Without them `described` stays false and `titled` never settles. `NativeBehavior.slots` runs the same helpers (`flagWhileBound`, `settleFlag`, `bindTrigger`) while a part's view is mounted, which worked. But it is a per-slot native mirror of `bind`, and the research on core's DOM surface counted 170 slots that declare `bind`.
7. **`Layer` isn't host-neutral.** It has no hook for back, which the web hears through a `CloseWatcher` inside `popup.ts`; `onEscape` takes a `KeyboardEvent`, `onOutsidePress` an `Event`, `contains` a `Node`. The twin widens the type with `onBack` and passes `undefined as unknown as KeyboardEvent`. TypeScript can't object: a native file is typed against the DOM module it imports.
8. **The `layers` twin had to mirror the whole module.** `layers.ts` mixes the stack's rules with document listening, so "the smallest owning module" isn't a module yet. The twin restates the stack: 13 exports, 139 lines. Smallest change upstream: move `listen` and `listenIn` to a file of their own and twin only that. No logic changes, but about 200 lines leave `layers.ts`, which is more than the bound allows as a diff.
9. **Dialog's Escape rule reads the DOM.** `onEscape` closes a non-modal dialog only when `core.popup.element()?.contains(activeElement())`. On native `element()` is undefined, so through that rule a non-modal dialog would never close on the escape gesture, silently. The native layer calls `popup.requestClose("escape-key")` and skips the rule. A non-modal dialog on native therefore closes on escape wherever focus is, which is not the web's behavior. Not exercised: the prototype's non-modal dialog renders in place, with no `OverlayHost`.

**Api paths that do nothing, or work by luck**

10. **`focus()` is one of many.** The probe called `focus()` on every primitive that has one and none threw: besides the two rerouted, the rest quietly focus nothing, 11 of them as a one-line `…?.focus()` on an element and the composites through `roving.focus()` or a helper. Parity means a reroute for each, so "a handful" for two components is a few dozen for all.
11. **Reads of elements inside shared paths return nothing.** `api.form()`, `dispatchChange(formElement())` and `submitImplicitly` on Switch (intended: no forms). `popup.element()` and `popup.layer()` are always undefined, so anything built on them is off: `internal.initialFocus()`, `backdropElement()`, `shortcutOf(el)`, and a dialog without a title, which the web names from its trigger's text with `nameOf(core.triggerElement())` (`popup-features.ts:368`) and native names with nothing. A pending Close action's announcement is another: with no `document`, `announce()` returns without doing anything (checked in Node), so it needs a twin of `platform/announce.ts`, which the prototype didn't write.
12. **A source the vocabulary doesn't have.** Back is reported as `touch` and the escape gesture as `virtual`, chosen in `popup-native.ts`. Neither is quite true of a hardware button. `onPress` can't tell a screen reader's activation from a finger, so the adapter guesses from whether a screen reader is on.
13. **The first focus request on open is wasted.** The layer asks as it shows, before React has mounted the content (`viewMounted=false`), and the content's slot behavior asks again once it has. Harmless, and a sign that "once it is mounted" needs the mount hook from item 6.

**Types, build and tooling**

14. **TypeScript doesn't follow twins,** as the council's minority said. A twin is checked alone, under core's config with the DOM `lib`. Nothing compares a twin's signatures with its module's.
15. **New public names trip upstream's lint.** `pnpm lint` exits 1 with 24 findings: `public-docs-pages` for `setNativeHost`, `liveAttrs` and `dialogNative`; `stability` on `liveAttrs`, which lives in upstream's `kernel/part.ts` and would need a JSDoc label there; and 20 `stability` findings because `@ui-sdk/react-native` isn't in `documentedPackages` (`scripts/public-exports.mjs`, upstream's). Passing means edits to those scripts, or docs pages.
16. **The published build needs more than a second folder.** Every entry needs the `react-native` condition, generated at pack time here. `#dev` needs it nested, or a native bundle would load the dev module from the DOM tree and hold two copies of the kernel's state. The `.native.js` files also ship in the DOM tree, unused. `publish-manifest.mjs` would have to learn the native tree if the conditions were written into `package.json`.
17. **The accessibility translation loses what the research said it would.** For these two components: `aria-readonly` and `aria-required` on the switch, `aria-haspopup` and `aria-controls` on the trigger, and the `dialog` role. `aria-labelledby` becomes `accessibilityLabelledBy`, which VoiceOver ignores, so on iOS the dialog isn't named by its title.

**The adapter**

18. **Sibling Backdrop and Content must share one `Modal`.** The adapter moves both elements into an outlet the root renders. It keeps the parts' shape, but React context from providers between the root and the content doesn't reach the content.
19. **Not built:** `OverlayHost`, non-modal placement, `TextInput` focus, `keepMounted` and enter or exit animation, ref merging with a user's `ref`, nested dialogs on a device, and declarations for the packed adapter.

## Not verified

- That an accessibility-focus request moves a screen reader's cursor, on either platform, for `focus()`, on open or on close. Only that the request was made with a mounted view.
- The rest of the screen hidden from VoiceOver while the dialog is open. On Android it was seen in the accessibility tree, not heard through TalkBack.
- The iOS escape gesture.
- The `virtual` source for a screen reader's activation.
- A pending Close action's announcement on a device. The playground's action takes 800 ms and the announcement waits 1,000 ms, so it never came up.
- The packed build on a device, and its types.
- Nested dialogs, non-modal dialogs and Alert Dialog on a device.
- A green `pnpm test:pr`. It exited 1 on a loaded machine; the failures don't trace to the diff, as [the web side](#2-the-web-side) shows, but the full plan was not seen to pass.
- The specs in WebKit and Firefox, which `test:pr` runs only with `--engines`.

## Running it

```sh
pnpm install
cd apps/native-playground && NATIVE_PLAYGROUND_PORT=8093 pnpm start
# then open exp://127.0.0.1:8093 (iOS) or exp://10.0.2.2:8093 (Android) in Expo Go 58

node scripts/prototype-host-seam/check-twins.mjs
node scripts/prototype-host-seam/probe-no-document.mjs [--native] [--window]
pnpm --filter @ui-sdk/core build && node scripts/prototype-host-seam/pack-native.mjs <out-dir>
```

## Screenshots

Saved outside the repo, in the session's scratch folder `host-seam-shots`: `ios-01` to `ios-08` and `android-01` to `android-09`, one per step in the tables above (`android-09` is the TalkBack attempt). The device logs in [host-seam-evidence](host-seam-evidence) are the durable record.
