# React Native expert: knowledge

What the React Native expert knows. Part 1 is React Native itself, part 2 is how `@ui-sdk/react-native` is built, part 3 is the checklist a review walks. Pinned to the versions the repo installs: React Native 0.88.1 with the New Architecture, Expo SDK 58, React 19.3.0 in the playground (`packages/react-native` peers `react >=19`, `react-native >=0.88`). The research behind part 1 is `docs/research/rn-accessibility-focus-keyboards.md` on the `research/rn-accessibility-focus-keyboards` branch, read against React Native's source at `v0.88.1`. When React Native changes, update this file and the date.

Last checked: 2026-11-16, against `packages/react-native` and `node_modules/react-native` 0.88.1.

## 1. React Native, as it behaves

### Accessibility props

- `View` rewrites `aria-label`, `aria-labelledby`, `aria-live`, `aria-hidden`, the `aria-*` states and values and `id` into `accessibility*` props and `nativeID` in JavaScript. `role` goes to native beside `accessibilityRole` and wins when both are set, so a `role` with no native mapping removes a working `accessibilityRole`.
- `aria-modal` does nothing on a `View` in 0.88: only `Pressable` maps it. Use `accessibilityViewIsModal`. iOS only; Android isolates with a `Modal` or `importantForAccessibility="no-hide-descendants"` on siblings.
- The `Role` type lacks `listbox`, `menuitemcheckbox`, `menuitemradio`, `gridcell`, `textbox` and `search`; an unknown string logs an error and becomes no role.
- iOS turns a role into traits. Only `button`, `link`, `image`, `header`, `search`, `adjustable`, `switch`, `tabbar`, `summary`, `progressbar`, `text`, `keyboardkey`, `imagebutton` and `togglebutton` give one. `togglebutton` gives the Button trait, like `button`, and its checked state is spoken as checked or unchecked from the value. Checkbox and radio are spoken as words React Native writes into the value. `expanded: false` says nothing in 0.88. A range value is read as `now / (max - min)`, so pass `text` when `min` isn't 0.
- Android turns a role into a class name TalkBack knows (button, check box, radio button, switch, seek bar, ...) or a role description. `dialog`, `option`, `tabpanel`, `group`, `tooltip`, `tree` and `listitem` map to nothing. `expanded` adds the expand or collapse action, which is how TalkBack knows the state.
- `accessibilityActions` with `onAccessibilityAction` is the only way to do anything but activate: `increment`/`decrement` (Adjustable on iOS, scroll actions on Android), `expand`/`collapse` (Android only), `escape` (iOS only, the two-finger scrub), `magicTap` (iOS only), `longpress` (Android only), and custom actions with a `label`.
- No relationships: no `aria-controls`, `describedby`, `activedescendant`, `owns`, `haspopup`, `posinset`, `setsize`. `aria-labelledby` is Android only, one id.
- Live regions are Android only. iOS has only `AccessibilityInfo.announceForAccessibility`.
- Android writes `busy`, `expanded` and `checked: "mixed"` into the view's `contentDescription` with `accessibilityLabel` (`BaseViewManager.updateViewContentDescription`). With no label that hides the text inside the view ("Busy" instead of "Save"), and the description is rewritten only from a state that names one of those keys, and never cleared when nothing is left to write.
- `announceForAccessibilityWithOptions`'s `queue` is iOS only; Android calls `announceForAccessibility`.

### Focus and keyboards

- Accessibility focus can be moved with `AccessibilityInfo.sendAccessibilityEvent(ref, 'focus')` but never observed: nothing tells JavaScript where the screen reader is.
- A `View` receives no key events in a stable build on either platform; `onKeyDown`, `onKeyUp` and `ref.focus()` on a `View` sit behind native feature flags that are off.
- Android: hardware-keyboard focus traversal (Tab, arrows) over focusable views, `onFocus`/`onBlur` on `Pressable`, Enter or Space clicks the focused view. `tabIndex={-1}` sets `focusable={false}`, which takes a view out of traversal only when it isn't `accessible`: `accessible` sets `isFocusable` (`ReactViewManager.setAccessible`). A disabled `accessibilityState` calls `setEnabled(false)`, and Android's focus search skips a disabled view.
- iOS: Full Keyboard Access traverses accessible elements with Tab and activates with Space; `Pressable` gets no focus events from it.
- `Pressable` reports `pressed` to a style function, and hover through `onHoverIn`/`onHoverOut` where a pointer exists.

### Direction

- `I18nManager.isRTL` is app wide and fixed at startup; changing it needs a reload. Flexbox `start`/`end` and `row` follow it.

### React on native

- Same rules of React as the web: pure render, effects only sync with the outside, StrictMode double-invokes initializers and effects. There is no server rendering and no `document`.
- Metro resolves `.native.ts` over `.ts`, and the `react-native` export condition. Expo's resolver dedupes `react` and `react-native` to the app's copy.

## 2. How `@ui-sdk/react-native` is built

- **The seam** (ADR 0001): a part reads its slot's declarative fields (`attrs`, `state`, `present`, `focus`) and delivers `press`. It never runs `bind`, `asleep`, `connect` or the `on` handlers. Native behavior lives in core's twins (`*.native.ts`, with a compile-time `Twin<>` check) and native behavior files, never in the adapter. Core never imports `react-native`.
- **`createParts(primitive, hosts)`** in `src/use-primitive.tsx` makes `Root` and one component per slot given a host, named in Pascal case; `usePrimitive` and `usePart` are the hand-written path. Same names and argument order as `@ui-sdk/react`, with a host component where React takes a tag.
- **Translation** is in one place, `src/accessibility.ts` (`toNativeProps(attrs, os)`): core's ARIA in, `accessibility*` props out, never `role` or `aria-*`. A user's `role`/`aria-*` go through it too; a user's `accessibility*` props win field by field (`mergeAccessibility`).
- **Styling**: `style`, `className` and `children` may be functions of `(state, interaction)`; `render` is an element or `(props, state, interaction)`. Styles merge as arrays, never flattened (`mergeProps` in `src/render-element.ts`). No `data-*`, no `dataSet`: every data attribute and CSS variable core writes is a state field.
- **Host interface**: `NativeHost` in core (`foundation/kernel/native-host.ts`) is implemented by `src/native-host.ts`, which maps parts to mounted views in a `WeakMap` filled by each part's ref.
- **Source**: a press reports `touch`, and `virtual` while a screen reader runs (`pressSource`).
- **Tests**: Jest with React Native Testing Library 14, two projects (ios, android) running every test; `render`, `fireEvent`, `act` and `rerender` are async. The playground, `apps/native-playground`, generates its screens from `examples/components/*/react-native/*.tsx`.
- **Docs**: `apps/docs/content/docs/react-native/`. Examples show as code only. A Part State table (`<PartStateTable>`) replaces the data attribute and CSS variable tables.

## 3. Review checklist

- Does any adapter file grow a listener, a focus call, an `aria-*` attribute or a rule? Behavior belongs in core: a twin or a native behavior file.
- Does every attribute core emits for this slot have a row in `toNativeProps`, for both OSes? Does a role core emits map to something each screen reader announces, or is the gap recorded?
- Does a part forward `role` or `aria-*` to a host? It must not.
- Would a `role` override a working `accessibilityRole`?
- Is a style flattened or spread instead of merged as an array? Does a host ever receive a function?
- Does a value only the web needs (`name`, `form`, `container`, `tabindex="-1"`) reach a host?
- Is focus requested once the view is mounted, and never assumed observed?
- Does something rely on a key event on a `View`, or on hover existing?
- Does it hold in StrictMode: an instance kept only at commit, nothing registered by a thrown-away initializer?
- Is the same behavior on iOS and Android, unless an accessibility API forces a difference, and is that difference tested in the right Jest project?
- Does a new example, docs page or playground screen follow the other frameworks' names?
