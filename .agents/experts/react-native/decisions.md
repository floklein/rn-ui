# React Native expert: decisions

What's already decided about `@ui-sdk/react-native`, and what's known and open. The expert never re-raises a **Settled** item as a finding. Seeded from the planning map's resolutions (issues #6 to #37 and #119 on `floklein/rn-ui`), gathered in `docs/specs/react-native.md`, and from `docs/adr/0001-host-seam.md`. The spec's "Rules for the build" are settled too.

Last reviewed: `e6e73b12` (2026-11-15, before the adapter's first code; no review has run yet)

## Settled

- **One primitive definition for both hosts** (ADR 0001, #13, #22). The adapter reads the declarative slot fields and delivers `press`; it never runs `bind`, `asleep`, `connect`, the `on` handlers or the DOM writers. Native behavior lives in core's twins and native behavior files; core never imports `react-native`. Edits inside upstream's files are limited to the ADR's list, and each is in the registry.
- **Real native views, at parity** (#2, #15). Not React Native Web, no DOM layer, no native code in the adapter, no OS controls or native modules. Floor: React Native 0.88, New Architecture, Expo SDK 58, no Metro configuration.
- **Dependencies** (#16): `react` and `react-native` only, plus Gesture Handler in Drawer's entry and the sheet entry. Insets come from the app through `OverlayHost`.
- **Names follow `@ui-sdk/react`** wherever the concept exists (#20). Same subpaths, no root entry; an entry is absent only when nothing in it exists on native (today `shortcuts`). Web-only options and values are absent from the types (`container`, `shortcut`, `modal="trap-focus"`, `name`, `form`, the hidden `input` part). Native-only names: `OverlayHost`, `interaction`, File Input's `pick`, `onExit`, `/sheet`.
- **Styling** (#18): every part takes `style`, `className`, `children` and `render`; the first three may be functions of state, resolved by the part. Styles merge as arrays, never flattened. No `data-*` or `dataSet`: each data attribute and CSS variable becomes a state field. `interaction` (`{ pressed, hovered, focused }`) is a separate argument. No styling library assumed; NativeWind v4 users call `cssInterop`.
- **Translation in one place** (#13, #30): core's ARIA in, `accessibility*` props out, never `role` or `aria-*`. A user's `accessibility*` props win field by field. `aria-controls`, `aria-owns` and `aria-activedescendant` are dropped: each option is its own accessible element.
- **Names and descriptions** (#30): plain-text children register under their id; `aria-labelledby` and `aria-describedby` resolve to `accessibilityLabel` and `accessibilityHint` on a single accessible element only, never on a container. A dialog is named by its title, which takes the focus request on open.
- **Focus** (#21): requests are never treated as observed. Popups request accessibility focus once mounted and return it to the trigger on close. Trapping is the `Modal`'s isolation, not a keyboard trap. No roving focus, arrow keys, Home, End or typeahead; core's roving `tabindex="-1"` is not forwarded.
- **Hardware keyboards** (#21): each OS's own navigation over correctly exposed elements, no native code for key events. Arrow keys in composites, shortcuts, a keyboard trap and Escape where the OS doesn't route it are a scope exception, revisited when React Native delivers key events to views in a stable build.
- **Popups** (#17): a popup modal at open renders in React Native's `Modal`, a non-modal one in the nearest host (`OverlayHost`, or the open `Modal`'s own host). Android back closes the topmost layer with the `"back"` reason.
- **Forms** (#23): no form participation and no hidden input. `required`, `disabled` and `readOnly` stay in state; `required` and `readOnly` aren't announced. The adapter adds no words of its own to a label.
- **Presence** (#24): a part that animates out takes `onExit(done)`; a fixed two-second timeout; the adapter ships no animation. Panels expose their measured size as state.
- **Direction** (#32): read from `I18nManager` at startup, app wide. No direction for part of the screen.
- **Sources** (rule 5): `touch` for a press and Android back, `virtual` for the iOS escape gesture, an accessibility action, or a press while a screen reader runs.
- **Checking** (#19, #8, #119): the native pattern check from `@ui-sdk/react-native/testing` on a host tree with no renderer; Jest with React Native Testing Library; device specs with Appium, Android blocking and iOS reporting; no spec with a screen reader on, a manual pass per component instead (`contributing/native-manual-pass.md`). A missing VoiceOver pass may be recorded as outstanding.
- **Docs and examples** (#31): a sixth section, `react-native`; examples in `examples/components/<name>/react-native/` shown as code only, kept compiling by the playground; a per-part state table replaces the data attribute and CSS variable tables; `pnpm test:docs` skips native.
- **Budgets** (#33): a byte budget per native entry in `size-budget.json`, measured by `scripts/size.mjs` with `react` and `react-native` external and core included. No performance budget.
- **Upstream** (#35): a registry maps twins, native behavior files, reroutes and additive edits to upstream files and commits; `pending` is one list, read by the parity, size and example checks.
- **Publishing** (#11): packed as `@rn-ui-sdk/*` tarballs with the fork's version; core gets a `dist/native` build with each twin in its module's place.

## Known and open (don't report again, check whether fixed)

- `aria-labelledby` and `aria-describedby` are dropped by the translation until names land (ticket 7 of the build plan).
- `scripts/check-packages.mjs` builds the adapter with `skipLibCheck: true`, since React Native's globals clash with `lib.dom` (ticket 17 revisits it).
