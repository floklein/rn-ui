# React Native expert: knowledge

What the React Native expert knows. Part 1 is React Native itself, part 2 is how `@ui-sdk/react-native` is built, part 3 is the checklist a review walks. Pinned to the versions the repo installs: React Native 0.88.1 with the New Architecture, Expo SDK 58, React 19.3.0 in the playground (`packages/react-native` peers `react >=19`, `react-native >=0.88`). The research behind part 1 is `docs/research/rn-accessibility-focus-keyboards.md` on the `research/rn-accessibility-focus-keyboards` branch, read against React Native's source at `v0.88.1`. When React Native changes, update this file and the date.

Last checked: 2026-11-17, against `packages/react-native` and `node_modules/react-native` 0.88.1.

## 1. React Native, as it behaves

### Accessibility props

- `View` rewrites `aria-label`, `aria-labelledby`, `aria-live`, `aria-hidden`, the `aria-*` states and values and `id` into `accessibility*` props and `nativeID` in JavaScript. `role` goes to native beside `accessibilityRole` and wins when both are set, so a `role` with no native mapping removes a working `accessibilityRole`.
- `aria-modal` does nothing on a `View` in 0.88: only `Pressable` maps it. Use `accessibilityViewIsModal`. iOS only; Android isolates with a `Modal` or `importantForAccessibility="no-hide-descendants"` on siblings.
- The `Role` type lacks `listbox`, `menuitemcheckbox`, `menuitemradio`, `gridcell`, `textbox` and `search`; an unknown string logs an error and becomes no role.
- iOS turns a role into traits. Only `button`, `link`, `image`, `header`, `search`, `adjustable`, `switch`, `tabbar`, `summary`, `progressbar`, `text`, `keyboardkey`, `imagebutton` and `togglebutton` give one. `togglebutton` gives the Button trait, like `button`, and its checked state is spoken as checked or unchecked from the value. Checkbox and radio are spoken as words React Native writes into the value. `expanded: false` says nothing in 0.88. A range value is read as `now / (max - min)`, so pass `text` when `min` isn't 0.
- Android writes `accessibilityValue.text` into the view's description, after the label, and rewrites it only from a value map that has `text` (`BaseViewManager.setAccessibilityValue`); an empty string clears it, and the delegate then describes the view by the text inside it (`ReactAccessibilityDelegate.getTalkbackDescription`). `progressbar` gives no Android class, and its `RangeInfo` takes `min`, `now` and `max` as integers.
- Android turns a role into a class name TalkBack knows (button, check box, radio button, switch, seek bar, ...) or a role description, like "Tab" and "Tab List" for `tab` and `tablist` (`ReactAccessibilityDelegate.kt`). `dialog`, `option`, `tabpanel`, `group`, `tooltip`, `tree`, `listitem` and `separator` map to nothing. `separator` is in the `Role` type but gives no iOS trait either (`RCTViewManager.m`), so no screen reader hears a separator. `expanded` adds the expand or collapse action, which is how TalkBack knows the state.
- `accessibilityActions` with `onAccessibilityAction` is the only way to do anything but activate: `increment`/`decrement` (Adjustable on iOS, scroll actions on Android), `expand`/`collapse` (Android only), `escape` (iOS only, the two-finger scrub), `magicTap` (iOS only), `longpress` (Android only), and custom actions with a `label`.
- No relationships: no `aria-controls`, `describedby`, `activedescendant`, `owns`, `haspopup`, `posinset`, `setsize`. `aria-labelledby` is Android only, one id.
- No current state: the adapter turns `aria-current="page"` into `selected` unless `aria-selected` is set (ticket 87). `list` becomes `android.widget.AbsListView` with no collection info (`ReactAccessibilityDelegate.kt`) and gives no iOS trait (`RCTViewManager.m`).
- Live regions are Android only. iOS has only `AccessibilityInfo.announceForAccessibility`; the adapter announces a live part's new text there (`useLiveText`, ticket 102).
- Hermes's `Intl` has no `Intl.Locale` and no `DateTimeFormat#formatRange` (seen on iOS 27.3, ticket 102): core's date twins work around both.
- Android writes `busy` and `checked: "mixed"` into the view's `contentDescription` with `accessibilityLabel`, and an `expanded` state rewrites it (`BaseViewManager.updateViewContentDescription`). With no label that hides the text inside the view ("Busy" instead of "Save"), and the description is rewritten only from a state that names one of those keys, and never cleared when nothing is left to write.
- `announceForAccessibilityWithOptions`'s `queue` is iOS only; Android calls `announceForAccessibility`.

### Focus and keyboards

- Accessibility focus can be moved with `AccessibilityInfo.sendAccessibilityEvent(ref, 'focus')` but never observed: nothing tells JavaScript where the screen reader is.
- A `View` receives no key events in a stable build on either platform; `onKeyDown`, `onKeyUp` and `ref.focus()` on a `View` sit behind native feature flags that are off.
- Android: hardware-keyboard focus traversal (Tab, arrows) over focusable views, `onFocus`/`onBlur` on `Pressable`, Enter or Space clicks the focused view. `tabIndex={-1}` sets `focusable={false}`, which takes a view out of traversal only when it isn't `accessible`: `accessible` sets `isFocusable` (`ReactViewManager.setAccessible`). A disabled `accessibilityState` calls `setEnabled(false)`, and Android's focus search skips a disabled view.
- iOS: Full Keyboard Access traverses accessible elements with Tab and activates with Space; `Pressable` gets no focus events from it. `tab` is one of the roles `RCTViewComponentView` counts as interactive, so a tab is a stop although it gets no trait.
- Android: `secureTextEntry={false}` gives a plain text field; `keyboardType="visible-password"` is the visible-password input type. An explicit `accessibilityState.disabled: false` calls `setEnabled(true)`, which undoes `editable={false}` on a `TextInput`.
- `TextInput` selection: `onChange` always comes before `onSelectionChange`. The `selection` prop is re-sent whenever it differs from the last native report (`useTextInputStateSynchronization`). iOS applies a JS selection with `notifyDelegate:NO`, so it's never reported back; Android's `ReactTextSelectionWatcher` drops a report equal to the last one it sent, and does report a selection set from JS. iOS draws selection handles whatever `selectionColor` says; only opacity hides them (above 0.01, or UIKit stops hit-testing the view and VoiceOver skips it).
- `inputMode` wins over `keyboardType` (`TextInput.js`), and `inputMode="numeric"` is `number-pad`: on Android `TYPE_CLASS_NUMBER` with no sign or decimal flag, where `keyboardType="numeric"` sets both. After `onChange`, `TextInput` re-renders itself and writes the JS `value` back with the `selection` prop of that render, or `-1,-1` (ticket 105).
- Hermes on iOS has no `Intl.NumberFormat.prototype.formatToParts` (ticket 105; core's parser goes through the `number-parts` twin).
- `Pressable` reports `pressed` to a style function. Hover reaches JavaScript only once the app turns on W3C pointer events (`RCTSetDispatchW3CPointerEvents(YES)` on iOS, `ReactFeatureFlags.dispatchPointerEvents` on Android; both off by default): then a view's `onPointerEnter`/`onPointerLeave` fire, with `pointerType`. `onHoverIn`/`onHoverOut` are dead on iOS and Android unless `shouldPressibilityUseW3CPointerEventsForHover` is also on, and then Pressability's pointer handlers replace the view's own and drop `pointerType`, so `usePart` tracks `hovered` through `onPointerEnter`/`onPointerLeave` and skips touch (#98). Pressability reads only `Pressable`'s own `disabled` prop: `accessibilityState.disabled` or `aria-disabled` dims it for screen readers (and disables the view on Android) but it still takes touches and reports `pressed`. `usePart` passes `disabled` to a pressed part whose translated state is disabled (#126). A part that turns disabled while held still runs `onPress` on release, and plays Android's click sound; `onPressOut` still resets the press.

### Accessibility actions on Android

- `ReactAccessibilityDelegate.kt` (0.88): a view with `accessibilityState.expanded` is offered `ACTION_EXPAND` or `ACTION_COLLAPSE` from its native tag, and performing either flips that tag first. Only declared `accessibilityActions` reach JS, and `accessibilityActionsMap` only grows, so once a view has declared both, a stale node can send `expand` to an expanded part: read the state when the action arrives. Declaring `activate` replaces the click with an event, so `onPress` no longer fires.

### Direction

- `Image` makes itself `accessible` for any `alt` (`Image.ios.js`, `Image.android.js`), and on iOS `aria-hidden` on an `Image` needs `accessible={false}`, since `accessibilityElementsHidden` isn't enough. On Android `Image`'s `accessible` is the view's `isFocusable`, a Tab stop. Jest's `Image` mock skips all of it: unmock `react-native/Libraries/Image/Image` to test it.
- `I18nManager.isRTL` is app wide and fixed at startup; changing it needs a reload. Flexbox `start`/`end` and `row` follow it.
- With `doLeftAndRightSwapInRTL`, on by default on both OSes, the `left` and `right` styles (position, margin, padding, border) mean start and end when the app runs right to left, while `onLayout` reports a physical `x` (`YogaLayoutableShadowNode.cpp`).

### React on native

- Same rules of React as the web: pure render, effects only sync with the outside, StrictMode double-invokes initializers and effects. There is no server rendering and no `document`.
- Metro resolves `.native.ts` over `.ts`, and the `react-native` export condition. Expo's resolver dedupes `react` and `react-native` to the app's copy.

## 2. How `@ui-sdk/react-native` is built

- **The seam** (ADR 0001): a part reads its slot's declarative fields (`attrs`, `state`, `present`, `focus`) and delivers `press`. It never runs `bind`, `asleep`, `connect` or the `on` handlers. Native behavior lives in core's twins (`*.native.ts`, with a compile-time `Twin<>` check) and native behavior files, never in the adapter. Core never imports `react-native`.
- A part's `el` and its press `event` are undefined on native, so a branch on either in a core `press` handler (Pagination's `opensElsewhere`, `keepFocus`) does nothing there.
- **`createParts(primitive, hosts)`** in `src/use-primitive.tsx` makes `Root` and one component per slot given a host, named in Pascal case; `usePrimitive` and `usePart` are the hand-written path. Same names and argument order as `@ui-sdk/react`, with a host component where React takes a tag.
- **Translation** is in one place, `src/accessibility.ts` (`toNativeProps(attrs, os)`): core's ARIA in, `accessibility*` props out, never `role` or `aria-*`. A user's `role`/`aria-*` go through it too, merged with core's in `ariaOf` as `@ui-sdk/react` merges them: core's value wins where it has one, the user's stands where core's is `undefined`, and `yieldToAuthor`'s names are the user's (#128). A role with no native counterpart falls back to the button role of `type="button"`. A user's `accessibility*` props win field by field (`mergeAccessibility`).
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
